<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Assets;

use App\Extensions\TitanBuilder\System\Models\BuilderAsset;
use App\Extensions\TitanBuilder\System\Models\BuilderProject;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;

final class AssetUploadService
{
    private const EXTENSIONS = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        'application/pdf' => 'pdf',
    ];

    public function store(int $companyId, int $projectId, UploadedFile $file): BuilderAsset
    {
        $project = BuilderProject::query()->forCompany($companyId)->whereKey($projectId)->first();
        if (! $project) {
            throw new InvalidArgumentException('Project was not found in the current company.');
        }

        $maxBytes = (int) config('titan-builder.assets.max_bytes', 10 * 1024 * 1024);
        $allowed = (array) config('titan-builder.assets.allowed_mime_types', array_keys(self::EXTENSIONS));
        $size = (int) $file->getSize();
        $mime = (string) ($file->getMimeType() ?: 'application/octet-stream');
        if ($size < 1 || $size > $maxBytes) {
            throw new InvalidArgumentException('Asset size is outside the configured limit.');
        }
        if (! in_array($mime, $allowed, true) || ! isset(self::EXTENSIONS[$mime])) {
            throw new InvalidArgumentException('Asset MIME type is not allowed.');
        }
        $realPath = $file->getRealPath();
        if (! is_string($realPath) || ! is_file($realPath)) {
            throw new InvalidArgumentException('Uploaded asset is unavailable for validation.');
        }

        $checksum = hash_file('sha256', $realPath);
        if (! is_string($checksum)) {
            throw new RuntimeException('Could not checksum uploaded asset.');
        }
        $disk = (string) config('titan-builder.assets.disk', 'local');
        $filename = (string) Str::uuid().'.'.self::EXTENSIONS[$mime];
        $directory = 'titan-builder/'.rawurlencode((string) $companyId).'/'.$projectId;
        $stored = Storage::disk($disk)->putFileAs($directory, $file, $filename, ['visibility' => 'private']);
        if (! is_string($stored) || $stored === '') {
            throw new RuntimeException('Asset storage failed.');
        }

        return BuilderAsset::query()->create([
            'company_id' => $companyId,
            'project_id' => $projectId,
            'disk' => $disk,
            'path' => $stored,
            'mime_type' => $mime,
            'size_bytes' => $size,
            'checksum' => $checksum,
            'meta' => ['original_name' => basename((string) $file->getClientOriginalName())],
        ]);
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\PrivateExportStore;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use DateTimeImmutable;
use DateTimeInterface;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

final class LocalPrivateExportStore implements PrivateExportStore
{
    public function put(string $companyId, string $filename, string $mimeType, string $contents, DateTimeInterface $expiresAt): array
    {
        $reference = bin2hex(random_bytes(24));
        $base = $this->basePath($companyId, $reference);
        Storage::disk('local')->put($base.'.bin', $contents);
        Storage::disk('local')->put($base.'.json', json_encode([
            'company_id' => $companyId,
            'filename' => basename($filename),
            'mime_type' => $mimeType,
            'expires_at' => $expiresAt->format(DATE_ATOM),
        ], JSON_THROW_ON_ERROR));

        return [
            'reference' => $reference,
            'signed_url' => URL::temporarySignedRoute('titan-maps-intelligence.exports.download', $expiresAt, ['reference' => $reference]),
            'expires_at' => $expiresAt->format(DATE_ATOM),
        ];
    }

    /** @return array{filename:string,mime_type:string,contents:string} */
    public function read(string $companyId, string $reference): array
    {
        if (preg_match('/^[a-f0-9]{48}$/', $reference) !== 1) {
            throw MapsIntelligenceException::fromCode('MAPS_EXPORT_NOT_FOUND', 'The export reference is invalid.');
        }
        $base = $this->basePath($companyId, $reference);
        $metadataPath = $base.'.json';
        $contentPath = $base.'.bin';
        if (! Storage::disk('local')->exists($metadataPath) || ! Storage::disk('local')->exists($contentPath)) {
            throw MapsIntelligenceException::fromCode('MAPS_EXPORT_NOT_FOUND', 'The export does not exist or has expired.');
        }

        $metadata = json_decode((string) Storage::disk('local')->get($metadataPath), true, 512, JSON_THROW_ON_ERROR);
        if (! is_array($metadata) || ! hash_equals($companyId, (string) ($metadata['company_id'] ?? ''))) {
            throw MapsIntelligenceException::fromCode('MAPS_TENANT_DENIED', 'The export does not belong to the authorised company.');
        }
        $expiresAt = new DateTimeImmutable((string) ($metadata['expires_at'] ?? '1970-01-01T00:00:00Z'));
        if ($expiresAt <= new DateTimeImmutable('now')) {
            Storage::disk('local')->delete([$metadataPath, $contentPath]);
            throw MapsIntelligenceException::fromCode('MAPS_EXPORT_EXPIRED', 'The export has expired.');
        }

        return [
            'filename' => basename((string) ($metadata['filename'] ?? 'titan-maps-export.bin')),
            'mime_type' => (string) ($metadata['mime_type'] ?? 'application/octet-stream'),
            'contents' => (string) Storage::disk('local')->get($contentPath),
        ];
    }

    private function basePath(string $companyId, string $reference): string
    {
        $tenantHash = hash('sha256', $companyId);
        return 'titan-maps-intelligence/exports/'.$tenantHash.'/'.$reference;
    }
}

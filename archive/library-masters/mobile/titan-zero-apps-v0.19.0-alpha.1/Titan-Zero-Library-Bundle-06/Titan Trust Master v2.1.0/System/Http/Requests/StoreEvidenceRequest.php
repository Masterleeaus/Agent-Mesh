<?php

declare(strict_types=1);

namespace App\Extensions\TitanTrust\System\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEvidenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $maxMb = (int) config('titantrust.max_upload_mb', 25);
        $maxKb = max(1, $maxMb * 1024);

        return [
            'file' => ['required', 'file', 'max:' . $maxKb, 'mimetypes:' . implode(',', (array) config('titantrust.allowed_mimes', []))],
            'evidence_type' => ['nullable', 'string', 'max:50'],
            'caption' => ['nullable', 'string', 'max:1000'],
            'job_id' => ['nullable', 'integer'],
            'job_item_id' => ['nullable', 'integer'],
            'site_id' => ['nullable', 'integer'],
        ];
    }
}

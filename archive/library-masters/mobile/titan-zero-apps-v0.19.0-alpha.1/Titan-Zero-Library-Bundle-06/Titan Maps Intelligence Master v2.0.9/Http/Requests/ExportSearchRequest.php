<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class ExportSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_id' => ['prohibited'],
            'format' => ['required', 'string', 'in:csv,json,xlsx'],
            'candidate_status' => ['sometimes', 'nullable', 'string', 'in:approved,rejected,pending,unreviewed'],
            'conversation_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'agent_id' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}

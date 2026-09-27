<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class MatchCandidateRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'company_id' => ['prohibited'],
            'workcore_entity_type' => ['required', 'string', 'in:lead,customer,provider,contractor,supplier'],
            'workcore_entity_id' => ['required', 'string', 'max:255'],
        ];
    }
}

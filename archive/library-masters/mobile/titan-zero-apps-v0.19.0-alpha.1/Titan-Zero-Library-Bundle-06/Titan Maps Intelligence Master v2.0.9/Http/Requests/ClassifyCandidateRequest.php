<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Requests;

use App\Extensions\TitanMapsIntelligence\Enums\CandidateType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ClassifyCandidateRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'company_id' => ['prohibited'],
            'candidate_type' => ['required', Rule::enum(CandidateType::class)],
            'reason' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }
}

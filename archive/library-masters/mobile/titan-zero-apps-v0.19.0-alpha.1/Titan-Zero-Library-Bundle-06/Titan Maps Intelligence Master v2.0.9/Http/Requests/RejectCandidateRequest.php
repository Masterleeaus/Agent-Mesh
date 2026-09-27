<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class RejectCandidateRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return ['company_id' => ['prohibited'], 'reason' => ['required', 'string', 'max:2000']];
    }
}

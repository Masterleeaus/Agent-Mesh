<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class AnalyseTerritoryRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'company_id' => ['prohibited'],
            'search_id' => ['required', 'string'],
            'analysis_type' => ['sometimes', 'string', 'in:provider_coverage,competitor_density,supplier_coverage,service_gap,branch_coverage,expansion_opportunity'],
            'search_area' => ['sometimes', 'array'],
        ];
    }
}

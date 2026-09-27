<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StoreSearchRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $maximumResults = (int) config('extensions.titan_maps_intelligence.limits.maximum_results', 100);
        $maximumRadiusMetres = (float) config('extensions.titan_maps_intelligence.limits.maximum_radius_metres', 50000);

        return [
            'company_id' => ['prohibited'],
            'query' => ['required', 'string', 'max:500'],
            'purpose' => ['required', 'string', 'in:provider_discovery,supplier_discovery,sales_lead_discovery,competitor_analysis,accommodation_discovery,emergency_sourcing'],
            'maximum_results' => ['sometimes', 'integer', 'min:1', 'max:'.$maximumResults],
            'language' => ['sometimes', 'string', 'max:12'],
            'country' => ['sometimes', 'nullable', 'string', 'size:2'],
            'category' => ['sometimes', 'nullable', 'string', 'max:120'],
            'latitude' => ['required_with:longitude', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['required_with:latitude', 'nullable', 'numeric', 'between:-180,180'],
            'radius_metres' => ['sometimes', 'nullable', 'numeric', 'gt:0', 'max:'.$maximumRadiusMetres],
            'open_now' => ['sometimes', 'boolean'],
            'minimum_rating' => ['sometimes', 'nullable', 'numeric', 'between:0,5'],
            'conversation_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'provider' => ['sometimes', 'nullable', 'string', 'max:80'],
        ];
    }
}

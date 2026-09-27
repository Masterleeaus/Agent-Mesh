<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class CandidateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $place = $this->resource->place ?? null;
        return [
            'id' => $this->id, 'search_id' => $this->discovery_search_id,
            'candidate_type' => $this->candidate_type, 'status' => $this->lifecycle_status,
            'review_status' => $this->review_status, 'relevance_score' => $this->relevance_score,
            'confidence_score' => $this->confidence_score, 'unresolved_match' => $this->unresolved_match,
            'place' => $place === null ? null : [
                'id' => $place->id, 'name' => $place->name, 'category' => $place->primary_category,
                'address' => $place->address, 'latitude' => $place->latitude, 'longitude' => $place->longitude,
                'phone' => $place->phone, 'website' => $place->website, 'public_email' => $place->public_email,
                'opening_hours' => $place->opening_hours, 'currently_open' => $place->currently_open,
                'rating' => $place->rating, 'review_count' => $place->review_count,
                'source_url' => $place->source_url, 'provider' => $place->provider,
                'confidence' => $place->confidence, 'last_observed_at' => $place->last_observed_at,
            ],
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class SearchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'purpose' => $this->purpose, 'query' => $this->query,
            'category' => $this->category, 'latitude' => $this->latitude, 'longitude' => $this->longitude,
            'radius_metres' => $this->radius_metres, 'maximum_results' => $this->maximum_results,
            'status' => $this->status, 'started_at' => $this->started_at, 'completed_at' => $this->completed_at,
            'cancelled_at' => $this->cancelled_at, 'created_at' => $this->created_at,
        ];
    }
}

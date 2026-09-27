<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class UsageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'provider' => $this->provider, 'operation' => $this->operation,
            'request_count' => $this->request_count, 'result_count' => $this->result_count,
            'billable_units' => $this->billable_units, 'estimated_cost' => $this->estimated_cost,
            'currency' => $this->currency, 'search_id' => $this->discovery_search_id,
            'recorded_at' => $this->recorded_at,
        ];
    }
}

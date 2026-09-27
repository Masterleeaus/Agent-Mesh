<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use App\Extensions\TitanMapsIntelligence\Services\ProviderHealthService;
use Illuminate\Http\JsonResponse;

final class ProviderHealthController
{
    public function __construct(private readonly ProviderHealthService $health) {}
    public function show(string $provider): JsonResponse
    {
        return response()->json(['data'=>$this->health->status($provider)]);
    }
}

<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;
use App\Extensions\TitanMapsIntelligence\Services\OfflineSpatialCapabilityManifest;
use Illuminate\Http\JsonResponse;
final class OfflineCapabilityManifestController
{
    public function __invoke(OfflineSpatialCapabilityManifest $manifest): JsonResponse
    {
        return response()->json(['data'=>$manifest->all(),'offline_authority_rule'=>'Offline execution may reduce authority but never increase it.']);
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

final class ResourceFallbackStagePolicy
{
    public function nextStage(bool $internalAvailable, int $approvedNetworkCount): string
    {
        if ($internalAvailable) return 'internal_available';
        if ($approvedNetworkCount > 0) return 'approved_network_review';
        return 'discovery_searching';
    }
}

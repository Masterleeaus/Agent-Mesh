<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

use App\Extensions\TitanMapsIntelligence\DTO\SpatialDecisionReceipt;

interface SpatialRewindRecorder
{
    public function record(SpatialDecisionReceipt $receipt): ?string;
}

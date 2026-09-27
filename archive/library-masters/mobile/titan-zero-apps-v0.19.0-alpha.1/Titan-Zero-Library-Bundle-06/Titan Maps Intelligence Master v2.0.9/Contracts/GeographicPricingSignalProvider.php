<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Contracts;
use App\Extensions\TitanMapsIntelligence\Models\TerritoryEvaluation;
interface GeographicPricingSignalProvider
{
    /** Evaluate geographic coverage and return persisted, advisory signal evidence for an authorised company context. */
    public function evaluate(array $target): TerritoryEvaluation;
}

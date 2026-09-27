<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts;

interface CRMIntelligenceEngineInterface
{
    public function getCustomerInsights(int $customerId): array;
    public function predictChurn(int $customerId): float;
    public function getCustomerSegment(int $customerId): string;
}

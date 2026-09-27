<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations;

use App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts\FinancialInsightEngineInterface;
use App\Extensions\InteractionEngine\System\Contracts\FinancialMetricsProviderInterface;

final class FinancialInsightEngine implements FinancialInsightEngineInterface
{
    public function __construct(private readonly ?FinancialMetricsProviderInterface $provider = null) {}

    public function getRevenueForecast(): float
    {
        return $this->provider()->revenueForecast();
    }

    public function getCashFlow(): array
    {
        return $this->provider()->cashFlow();
    }

    public function getProfitabilityMetrics(): array
    {
        return $this->provider()->profitabilityMetrics();
    }

    private function provider(): FinancialMetricsProviderInterface
    {
        if (!$this->provider instanceof FinancialMetricsProviderInterface) {
            throw new \LogicException('Financial insight is unavailable until an authoritative company-scoped finance provider is registered.');
        }
        return $this->provider;
    }
}

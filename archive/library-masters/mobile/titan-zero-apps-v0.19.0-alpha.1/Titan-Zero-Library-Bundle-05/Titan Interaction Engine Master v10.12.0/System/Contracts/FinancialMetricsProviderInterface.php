<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Contracts;

interface FinancialMetricsProviderInterface
{
    public function revenueForecast(): float;
    public function cashFlow(): array;
    public function profitabilityMetrics(): array;
}

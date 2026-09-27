<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Executive\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Executive\Contracts\RiskEngineInterface;
class RiskEngine implements RiskEngineInterface
{
    private array $risks = [];

    public function assess(array $context): array
    {
        $score = 0;
        $risks = [];
        if (isset($context['financial_value']) && $context['financial_value'] > 10000) {
            $risks[] = 'High value transaction';
            $score += 20;
        }
        if (isset($context['new_customer'])) {
            $risks[] = 'New customer risk';
            $score += 10;
        }
        $this->risks = $risks;
        return ['score' => $score, 'risks' => $risks];
    }

    public function getRisks(): array
    {
        return $this->risks;
    }

    public function mitigate(string $risk, string $strategy): void
    {
        $this->risks[$risk] = $strategy;
    }

    public function getRiskScore(array $context): float
    {
        return $this->assess($context)['score'];
    }
}

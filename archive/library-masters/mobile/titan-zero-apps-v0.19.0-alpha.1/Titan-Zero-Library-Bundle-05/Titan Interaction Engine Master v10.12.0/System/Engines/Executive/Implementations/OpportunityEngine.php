<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Executive\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Executive\Contracts\OpportunityEngineInterface;
class OpportunityEngine implements OpportunityEngineInterface
{
    private array $tracked = [];

    public function identify(array $context): array
    {
        $opportunities = [];
        if (isset($context['customer_activity']) && $context['customer_activity'] > 0) {
            $opportunities[] = ['type' => 'upsell', 'name' => 'Upsell to active customer'];
        }
        if (isset($context['market_trend']) && $context['market_trend'] === 'growing') {
            $opportunities[] = ['type' => 'market_expansion', 'name' => 'Expand into growing market'];
        }
        return $opportunities;
    }

    public function prioritize(array $opportunities): array
    {
        usort($opportunities, fn($a, $b) => ($b['value'] ?? 0) <=> ($a['value'] ?? 0));
        return $opportunities;
    }

    public function capture(string $opportunity, array $plan): void
    {
        $this->tracked[] = ['opportunity' => $opportunity, 'plan' => $plan, 'status' => 'in_progress'];
    }

    public function getTrackedOpportunities(): array
    {
        return $this->tracked;
    }
}

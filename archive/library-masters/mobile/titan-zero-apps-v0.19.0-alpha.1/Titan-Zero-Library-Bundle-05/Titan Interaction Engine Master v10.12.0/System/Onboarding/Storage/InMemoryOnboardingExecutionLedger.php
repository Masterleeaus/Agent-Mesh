<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Onboarding\Storage;

final class InMemoryOnboardingExecutionLedger implements OnboardingExecutionLedgerInterface
{
    private array $results = [];
    public function result(string $companyId, string $planId, string $actionId): ?array
    {
        return $this->results[$companyId][$planId][$actionId] ?? null;
    }
    public function record(string $companyId, string $planId, string $actionId, array $result): void
    {
        $this->results[$companyId][$planId][$actionId] = $result;
    }
}

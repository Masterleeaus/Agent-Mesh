<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Onboarding;

final readonly class OnboardingExecutionResult
{
    public function __construct(
        public string $planId,
        public string $companyId,
        public array $results,
    ) {}

    public function toArray(): array
    {
        $counts = ['executed' => 0, 'already_executed' => 0, 'pending_approval' => 0, 'unavailable' => 0, 'blocked' => 0, 'blocked_dependency' => 0, 'offline_deferred' => 0, 'failed' => 0];
        foreach ($this->results as $result) {
            $status = (string) ($result['status'] ?? 'failed');
            if (array_key_exists($status, $counts)) $counts[$status]++;
        }
        return [
            'plan_id' => $this->planId,
            'company_id' => $this->companyId,
            'results' => $this->results,
            'summary' => $counts,
        ];
    }
}

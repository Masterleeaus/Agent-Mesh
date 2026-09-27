<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Onboarding\Storage;

interface OnboardingExecutionLedgerInterface
{
    public function result(string $companyId, string $planId, string $actionId): ?array;
    public function record(string $companyId, string $planId, string $actionId, array $result): void;
}

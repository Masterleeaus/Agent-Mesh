<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Onboarding\Storage;

interface OnboardingApprovalStoreInterface
{
    public function put(string $companyId, string $planId, string $actionId, array $grant, int $ttlSeconds = 900): void;
    public function get(string $companyId, string $planId, string $actionId): ?array;
}

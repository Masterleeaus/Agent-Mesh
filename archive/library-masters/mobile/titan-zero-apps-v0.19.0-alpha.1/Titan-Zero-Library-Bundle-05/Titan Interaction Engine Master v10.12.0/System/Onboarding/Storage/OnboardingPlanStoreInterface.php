<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Onboarding\Storage;

use App\Extensions\InteractionEngine\System\Onboarding\OnboardingPlan;

interface OnboardingPlanStoreInterface
{
    public function put(OnboardingPlan $plan): void;
    public function get(string $companyId, string $planId): ?OnboardingPlan;
    public function forget(string $companyId, string $planId): void;
}

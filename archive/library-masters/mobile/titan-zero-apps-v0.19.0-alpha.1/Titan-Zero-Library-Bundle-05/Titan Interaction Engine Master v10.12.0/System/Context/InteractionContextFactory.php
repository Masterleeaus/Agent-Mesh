<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Context;

use App\Extensions\InteractionEngine\System\Contracts\InteractionContext;
use App\Extensions\InteractionEngine\System\Contracts\InteractionContextFactoryInterface;
use App\Extensions\InteractionEngine\System\Surfaces\SurfaceWizardPolicy;

final class InteractionContextFactory implements InteractionContextFactoryInterface
{
    public function __construct(private SurfaceWizardPolicy $surfaces) {}

    public function make(
        string $companyId,
        string $actorId,
        string $surface,
        ?string $journey = null,
        ?string $deviceId = null,
        array $roles = [],
        array $capabilities = [],
        array $metadata = []
    ): InteractionContext {
        $canonicalSurface = $this->surfaces->canonicalSurface($surface);
        $canonicalJourney = $this->surfaces->canonicalJourney($journey);

        // A legacy "onboarding" surface means Zero + onboarding journey.
        if (in_array(strtolower(trim($surface)), ['onboarding','setup','titan_onboarding','titan-onboarding'], true)) {
            $canonicalJourney = 'onboarding';
        }

        if ($canonicalJourney === 'onboarding' && $canonicalSurface !== 'zero') {
            throw new \InvalidArgumentException('Onboarding is available only as a Zero journey.');
        }

        return new InteractionContext(
            companyId: $companyId,
            actorId: $actorId,
            surface: $canonicalSurface,
            journey: $canonicalJourney,
            deviceId: $deviceId,
            roles: $roles,
            capabilities: $capabilities,
            metadata: $metadata
        );
    }
}

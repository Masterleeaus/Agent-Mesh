<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Support;

use App\Extensions\TitanAppsCore\System\Contracts\AppSurface;
use InvalidArgumentException;

final readonly class AppJourneyContext
{
    public function __construct(
        public AppSurface $surface,
        public string $journey,
        public string $step,
        public array $state = [],
    ) {
        if (trim($journey) === '') throw new InvalidArgumentException('Journey id is required.');
        if (trim($step) === '') throw new InvalidArgumentException('Journey step is required.');
        if ($journey === 'onboarding' && $surface !== AppSurface::Zero) {
            throw new InvalidArgumentException('Onboarding is a Titan Zero journey.');
        }
    }

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return [
            'surface'=>$this->surface->value,
            'journey'=>$this->journey,
            'step'=>$this->step,
            'state'=>$this->state,
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Support;

use App\Extensions\TitanAppsCore\System\Contracts\AppSurface;
use InvalidArgumentException;

final readonly class AppContext
{
    /** @param array<string,mixed> $attributes */
    public function __construct(
        public AppSurface $surface,
        public int $companyId,
        public int $actorId,
        public ?string $sessionId = null,
        public array $attributes = [],
    ) {
        if ($companyId < 1) throw new InvalidArgumentException('Titan Apps context requires company_id.');
        if ($actorId < 1) throw new InvalidArgumentException('Titan Apps context requires actor_id.');
    }

    public function identity(): AppIdentity { return AppIdentity::forSurface($this->surface); }

    public function attribute(string $key, mixed $default = null): mixed
    {
        return $this->attributes[$key] ?? $default;
    }
}

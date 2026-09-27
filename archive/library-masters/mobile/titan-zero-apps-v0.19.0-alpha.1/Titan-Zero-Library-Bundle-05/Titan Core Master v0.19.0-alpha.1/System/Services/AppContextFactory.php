<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

use App\Extensions\TitanAppsCore\System\Contracts\AppSurface;
use App\Extensions\TitanAppsCore\System\Support\AppContext;

final class AppContextFactory
{
    /** @param array<string,mixed> $attributes */
    public function make(
        string|AppSurface $surface,
        int $companyId,
        int $actorId,
        ?string $sessionId = null,
        array $attributes = [],
    ): AppContext {
        return new AppContext(
            $surface instanceof AppSurface ? $surface : AppSurface::resolve($surface),
            $companyId,
            $actorId,
            $sessionId,
            $attributes,
        );
    }
}

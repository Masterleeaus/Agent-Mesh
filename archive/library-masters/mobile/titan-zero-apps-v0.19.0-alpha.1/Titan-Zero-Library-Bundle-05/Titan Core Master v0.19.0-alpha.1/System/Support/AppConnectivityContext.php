<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Support;

final readonly class AppConnectivityContext
{
    public function __construct(
        public bool $online,
        public bool $metered = false,
        public ?string $effectiveType = null,
    ) {}
}

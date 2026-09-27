<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Support;

final readonly class AppDeviceContext
{
    /** @param array<string,bool> $capabilities */
    public function __construct(
        public string $deviceClass = 'unknown',
        public array $capabilities = [],
        public bool $reducedMotion = false,
        public bool $lowPower = false,
    ) {}

    public function supports(string $capability): bool { return (bool)($this->capabilities[$capability] ?? false); }
}

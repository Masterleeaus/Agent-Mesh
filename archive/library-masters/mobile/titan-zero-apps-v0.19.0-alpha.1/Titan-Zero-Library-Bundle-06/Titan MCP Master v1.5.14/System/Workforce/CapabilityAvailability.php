<?php
declare(strict_types=1);
namespace App\Extensions\TitanMcp\System\Workforce;

final class CapabilityAvailability
{
    public function __construct(
        public readonly string $providerKey,
        public readonly string $capability,
        public readonly string $state,
        public readonly string $reasonCode,
    ) {}
}

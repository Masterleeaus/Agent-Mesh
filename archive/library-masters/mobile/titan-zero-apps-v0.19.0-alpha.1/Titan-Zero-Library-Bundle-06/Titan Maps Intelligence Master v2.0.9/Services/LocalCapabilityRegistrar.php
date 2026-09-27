<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\CapabilityRegistrar;

final class LocalCapabilityRegistrar implements CapabilityRegistrar
{
    /** @var array<string, array> */
    private array $definitions = [];

    public function register(array $definition): void
    {
        $key = trim((string) ($definition['key'] ?? $definition['name'] ?? ''));
        if ($key === '') {
            $key = hash('sha256', serialize($definition));
        }
        $this->definitions[$key] = $definition;
    }

    /** @return array<string, array> */
    public function definitions(): array
    {
        return $this->definitions;
    }
}

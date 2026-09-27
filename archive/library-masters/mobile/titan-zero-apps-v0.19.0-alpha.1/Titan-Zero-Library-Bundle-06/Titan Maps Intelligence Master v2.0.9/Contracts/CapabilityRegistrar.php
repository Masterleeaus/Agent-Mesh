<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

interface CapabilityRegistrar
{
    public function register(array $definition): void;
}

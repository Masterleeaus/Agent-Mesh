<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Contracts;

interface CapabilityDiscovery
{
    public function has(string $capability, ?int $companyId = null): bool;

    /** @return list<string> */
    public function available(?int $companyId = null): array;
}

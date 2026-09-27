<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts;

interface InterfaceContributionRegistry
{
    public function register(InterfaceContribution $contribution): void;
    /** @return list<InterfaceContribution> */ public function all(): array;
    public function find(string $key): ?InterfaceContribution;
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts;

interface InterfaceContribution
{
    public function key(): string;
    /** @return array<string,mixed> */ public function definition(): array;
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts;

interface BuilderCatalogue
{
    public function has(string $component): bool;
    /** @return array<string,mixed>|null */ public function definition(string $component): ?array;
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Contracts;

interface AppRuntimeDependency
{
    public function id(): string;
    public function required(): bool;

    /** @return list<string> */
    public function contractCandidates(): array;
}

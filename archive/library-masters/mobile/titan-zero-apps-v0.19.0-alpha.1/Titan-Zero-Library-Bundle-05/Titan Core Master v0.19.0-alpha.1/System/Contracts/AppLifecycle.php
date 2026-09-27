<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Contracts;

interface AppLifecycle
{
    /** @return array<string,mixed> */
    public function describe(): array;

    /** @return array<string,mixed> */
    public function readiness(): array;
}

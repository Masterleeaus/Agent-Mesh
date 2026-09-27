<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Contracts;

interface AppRegistration
{
    public function surface(): AppSurface;
    public function appId(): string;

    /** @return array<string,mixed> */
    public function toArray(): array;
}

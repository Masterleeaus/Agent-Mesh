<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Contracts;

interface PlatformAccessibleServiceRegistry
{
    /** @return array<string,array<string,mixed>> */
    public function catalogue(): array;
}

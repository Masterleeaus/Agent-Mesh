<?php
declare(strict_types=1);
namespace App\Extensions\TitanAppsCore\System\Contracts;

interface ExtensionInstallReadiness
{
    /** @return array<string,mixed> */
    public function inspect(): array;
}

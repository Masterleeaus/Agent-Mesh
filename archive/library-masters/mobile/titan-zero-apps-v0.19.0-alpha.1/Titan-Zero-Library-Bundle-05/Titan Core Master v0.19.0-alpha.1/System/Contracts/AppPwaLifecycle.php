<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Contracts;

interface AppPwaLifecycle
{
    /** @return array<string,mixed> */
    public function policy(AppSurface $surface): array;
}

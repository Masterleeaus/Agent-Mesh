<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts;

interface TitanInterfaceRuntimeManagerContract
{
    /** @return array<string, mixed> */
    public function health(): array;

    /** @return array<string, bool|string> */
    public function boundaries(): array;
}

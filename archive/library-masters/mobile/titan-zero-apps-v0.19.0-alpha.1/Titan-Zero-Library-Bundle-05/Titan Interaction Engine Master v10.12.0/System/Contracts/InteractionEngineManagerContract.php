<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Contracts;

interface InteractionEngineManagerContract
{
    public function health(): array;
    public function isEnabled(): bool;
}

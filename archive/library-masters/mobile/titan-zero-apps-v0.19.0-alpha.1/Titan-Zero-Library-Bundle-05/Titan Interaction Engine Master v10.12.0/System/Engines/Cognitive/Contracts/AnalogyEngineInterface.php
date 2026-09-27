<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts;

interface AnalogyEngineInterface
{
    public function findAnalogies(string $problem): array;
    public function mapAnalogy(array $source, array $target): array;
    public function applyAnalogy(array $source, array $target): array;
}

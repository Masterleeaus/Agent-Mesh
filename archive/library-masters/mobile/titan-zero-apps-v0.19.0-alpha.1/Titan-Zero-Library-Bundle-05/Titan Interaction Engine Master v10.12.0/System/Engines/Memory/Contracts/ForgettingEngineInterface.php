<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Memory\Contracts;

interface ForgettingEngineInterface
{
    public function decay(float $rate): void;
    public function forgetOlderThan(int $days): void;
    public function getForgettingCurve(): array;
}

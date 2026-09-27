<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Memory\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Memory\Contracts\ForgettingEngineInterface;

class ForgettingEngine implements ForgettingEngineInterface
{
    private float $rate = 0.1;
    private int $olderThanDays = 180;

    public function decay(float $rate): void
    {
        if ($rate < 0 || $rate > 1) {
            throw new \InvalidArgumentException('Decay rate must be between 0 and 1.');
        }
        $this->rate = $rate;
    }

    public function forgetOlderThan(int $days): void
    {
        if ($days < 0) {
            throw new \InvalidArgumentException('Days cannot be negative.');
        }
        $this->olderThanDays = $days;
    }

    public function getForgettingCurve(): array
    {
        $curve = [];
        foreach ([0, 1, 7, 30, 90, 180, 365] as $day) {
            $retention = exp(-$this->rate * $day / max(1, $this->olderThanDays));
            $curve[] = ['day' => $day, 'retention' => round($retention, 4), 'forget' => $day > $this->olderThanDays];
        }
        return $curve;
    }
}

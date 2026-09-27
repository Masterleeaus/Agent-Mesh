<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Contracts;

enum AppSurface: string
{
    case Zero = 'zero';
    case Go = 'go';
    case Hub = 'hub';

    public static function resolve(string $surface): self
    {
        $value = strtolower(trim($surface));
        return match ($value) {
            'zero', 'bos', 'command', 'owner', 'manager', 'business' => self::Zero,
            'go', 'field', 'worker' => self::Go,
            'hub', 'customer' => self::Hub,
            default => throw new \InvalidArgumentException('Unknown Titan Apps surface: '.$surface),
        };
    }

    /** @return list<string> */
    public function aliases(): array
    {
        return match ($this) {
            self::Zero => ['zero','bos','command','owner','manager','business'],
            self::Go => ['go','field','worker'],
            self::Hub => ['hub','customer'],
        };
    }
}

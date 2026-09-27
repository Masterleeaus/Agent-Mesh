<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

use App\Extensions\TitanAppsCore\System\Contracts\AppSurface;

final class AppSurfaceAudienceResolver
{
    public function surface(string|AppSurface $value): AppSurface
    {
        return $value instanceof AppSurface ? $value : AppSurface::resolve($value);
    }

    /**
     * Internal catalogue compatibility audience.
     *
     * These values are not canonical app identities; they exist only because
     * the retained module/action catalogue still encodes business/worker/customer.
     */
    public function catalogueAudience(string|AppSurface $surface): string
    {
        return match ($this->surface($surface)) {
            AppSurface::Zero => 'business',
            AppSurface::Go => 'worker',
            AppSurface::Hub => 'customer',
        };
    }

    public function canonicalSurfaceForAudience(string $audience): AppSurface
    {
        return match (strtolower(trim($audience))) {
            'business','owner','manager','bos','command','zero' => AppSurface::Zero,
            'worker','field','go' => AppSurface::Go,
            'customer','hub' => AppSurface::Hub,
            default => throw new \InvalidArgumentException('Unknown Titan Apps audience: '.$audience),
        };
    }
}

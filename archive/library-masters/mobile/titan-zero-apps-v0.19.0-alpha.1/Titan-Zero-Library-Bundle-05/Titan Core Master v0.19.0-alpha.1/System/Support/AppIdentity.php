<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Support;

use App\Extensions\TitanAppsCore\System\Contracts\AppSurface;

final readonly class AppIdentity
{
    public function __construct(
        public AppSurface $surface,
        public string $appId,
        public string $displayName,
    ) {}

    public static function forSurface(AppSurface $surface): self
    {
        return match ($surface) {
            AppSurface::Zero => new self($surface, 'titan-apps-zero', 'Titan Zero'),
            AppSurface::Go => new self($surface, 'titan-apps-go', 'Titan Go'),
            AppSurface::Hub => new self($surface, 'titan-apps-hub', 'Titan Hub'),
        };
    }

    /** @return array{surface:string,app_id:string,display_name:string} */
    public function toArray(): array
    {
        return [
            'surface'=>$this->surface->value,
            'app_id'=>$this->appId,
            'display_name'=>$this->displayName,
        ];
    }
}

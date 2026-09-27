<?php

namespace Modules\QualityControl\Filament\Plugin;

use Filament\Contracts\Plugin;
use Filament\Panel;
use Modules\QualityControl\Filament\Resources\InspectionScheduleResource;
use Modules\QualityControl\Filament\Resources\QualityCheckResource;
use Modules\QualityControl\Filament\Widgets\QualityScoreboard;

final class QualityControlPlugin implements Plugin
{
    public static function make(): static
    {
        return app(static::class);
    }

    public function getId(): string
    {
        return 'quality-control';
    }

    public function register(Panel $panel): void
    {
        $panel->resources([
            InspectionScheduleResource::class,
            QualityCheckResource::class,
        ])->widgets([
            QualityScoreboard::class,
        ]);
    }

    public function boot(Panel $panel): void
    {
    }
}

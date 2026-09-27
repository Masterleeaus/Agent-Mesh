<?php

namespace Modules\QualityControl\Filament\Resources\InspectionScheduleResource\Pages;

use Filament\Resources\Pages\ViewRecord;
use Modules\QualityControl\Filament\Resources\InspectionScheduleResource;

final class ViewInspectionSchedule extends ViewRecord
{
    protected static string $resource = InspectionScheduleResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }
}

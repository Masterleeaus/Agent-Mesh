<?php

namespace Modules\QualityControl\Filament\Resources\InspectionScheduleResource\Pages;

use Filament\Resources\Pages\ListRecords;
use Modules\QualityControl\Filament\Resources\InspectionScheduleResource;

final class ListInspectionSchedules extends ListRecords
{
    protected static string $resource = InspectionScheduleResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }
}

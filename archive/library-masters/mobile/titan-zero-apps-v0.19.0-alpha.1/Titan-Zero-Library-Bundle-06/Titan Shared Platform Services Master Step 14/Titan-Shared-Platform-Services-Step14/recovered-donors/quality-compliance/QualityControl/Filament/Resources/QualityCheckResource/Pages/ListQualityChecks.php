<?php

namespace Modules\QualityControl\Filament\Resources\QualityCheckResource\Pages;

use Filament\Resources\Pages\ListRecords;
use Modules\QualityControl\Filament\Resources\QualityCheckResource;

final class ListQualityChecks extends ListRecords
{
    protected static string $resource = QualityCheckResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }
}

<?php

namespace Modules\QualityControl\Filament\Resources\QualityCheckResource\Pages;

use Filament\Resources\Pages\ViewRecord;
use Modules\QualityControl\Filament\Resources\QualityCheckResource;

final class ViewQualityCheck extends ViewRecord
{
    protected static string $resource = QualityCheckResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }
}

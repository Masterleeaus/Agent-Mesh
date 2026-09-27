<?php

namespace Modules\QualityControl\Domain\Quality\Actions;

use Modules\QualityControl\Domain\Quality\DTOs\InspectionScheduleData;
use Modules\QualityControl\Entities\Schedule;

final class CreateInspectionScheduleAction
{
    public function handle(InspectionScheduleData $data): Schedule
    {
        return Schedule::create($data->toArray());
    }
}

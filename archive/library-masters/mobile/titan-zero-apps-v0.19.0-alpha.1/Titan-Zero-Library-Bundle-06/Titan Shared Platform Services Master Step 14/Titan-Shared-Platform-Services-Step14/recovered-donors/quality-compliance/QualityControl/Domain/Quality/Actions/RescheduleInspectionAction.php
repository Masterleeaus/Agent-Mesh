<?php

namespace Modules\QualityControl\Domain\Quality\Actions;

use Modules\QualityControl\Entities\Schedule;

final class RescheduleInspectionAction
{
    public function handle(Schedule $schedule, string $issueDate): Schedule
    {
        $schedule->issue_date = $issueDate;
        $schedule->save();

        return $schedule;
    }
}

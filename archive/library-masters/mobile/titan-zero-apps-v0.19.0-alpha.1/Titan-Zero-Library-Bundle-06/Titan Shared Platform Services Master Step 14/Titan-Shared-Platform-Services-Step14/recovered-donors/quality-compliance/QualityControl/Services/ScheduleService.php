<?php

namespace Modules\QualityControl\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Modules\QualityControl\Entities\Schedule;

class ScheduleService
{
    public function findForTenant(int $scheduleId, ?User $user = null): Schedule
    {
        $user ??= user();

        $schedule = Schedule::findOrFail($scheduleId);
        $companyId = $user->company_id ?? null;

        if ($companyId && !is_null($schedule->company_id) && (int) $schedule->company_id !== (int) $companyId) {
            throw (new ModelNotFoundException())->setModel(Schedule::class, [$scheduleId]);
        }

        return $schedule;
    }

    public function setOutcome(Schedule $schedule, string $outcome): Schedule
    {
        $schedule->qc_outcome = $outcome;
        $schedule->qc_outcome_set_at = now();
        $schedule->save();

        return $schedule;
    }
}


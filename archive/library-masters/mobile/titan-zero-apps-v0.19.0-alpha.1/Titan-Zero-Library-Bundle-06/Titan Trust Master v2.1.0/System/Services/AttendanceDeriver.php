<?php

declare(strict_types=1);

namespace App\Extensions\TitanTrust\System\Services;

use App\Extensions\TitanTrust\System\Models\WorkEvidenceItem;
use App\Extensions\TitanTrust\System\Models\WorkJobAttendance;

class AttendanceDeriver
{
    public static function getOrCreate(int $companyId, int $userId, int $jobId, ?int $staffUserId = null): WorkJobAttendance
    {
        $attendance = WorkJobAttendance::query()
            ->where('company_id', $companyId)
            ->where('job_id', $jobId)
            ->first();

        if (!$attendance) {
            $attendance = WorkJobAttendance::query()->create([
                'company_id' => $companyId,
                'user_id' => $userId,
                'job_id' => $jobId,
                'staff_user_id' => $staffUserId,
            ]);
        } elseif ($staffUserId && empty($attendance->staff_user_id)) {
            $attendance->update(['staff_user_id' => $staffUserId]);
        }

        return $attendance;
    }

    public static function refreshDerived(int $companyId, int $userId, int $jobId): WorkJobAttendance
    {
        $attendance = self::getOrCreate($companyId, $userId, $jobId, null);

        $first = WorkEvidenceItem::query()
            ->where('company_id', $companyId)
            ->where('job_id', $jobId)
            ->min('captured_at');

        $last = WorkEvidenceItem::query()
            ->where('company_id', $companyId)
            ->where('job_id', $jobId)
            ->max('captured_at');

        $attendance->update([
            'derived_first_capture_at' => $first,
            'derived_last_capture_at' => $last,
        ]);

        // If no manual times exist, set derived as default attendance boundaries
        if (empty($attendance->clock_in_at) && $first) {
            $attendance->update([
                'clock_in_at' => $first,
                'clock_in_source' => 'derived',
            ]);
        }
        if (empty($attendance->clock_out_at) && $last) {
            $attendance->update([
                'clock_out_at' => $last,
                'clock_out_source' => 'derived',
            ]);
        }

        return $attendance->fresh();
    }
}

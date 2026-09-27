<?php

namespace App\Extensions\TitanTrust\System\Audit;

use Illuminate\Support\Facades\DB;

class JobTimeline
{
    public static function list(int $companyId, int $userId, int $jobId, int $limit = 200)
    {
        return DB::table('work_jobs_events')
            ->where('company_id', $companyId)
            ->where('job_id', $jobId)
            ->orderByDesc('occurred_at')
            ->limit($limit)
            ->get();
    }
}

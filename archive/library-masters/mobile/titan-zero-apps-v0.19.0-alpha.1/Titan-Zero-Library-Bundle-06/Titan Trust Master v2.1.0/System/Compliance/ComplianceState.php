<?php

namespace App\Extensions\TitanTrust\System\Compliance;

use Illuminate\Support\Facades\DB;

/**
 * Doctrine v2 typed states for jobs compliance.
 *
 * work_jobs_states:
 * - state_type (REQUIRED)
 * - state_key (REQUIRED)
 * - status (REQUIRED)
 */
class ComplianceState
{
    public static function upsert(
        int $companyId,
        int $userId,
        int $jobId,
        string $stateKey,
        string $status,
        ?float $score = null,
        array $reasons = [],
        array $meta = []
    ): void {
        $now = now();

        $existing = DB::table('work_jobs_states')
            ->where('company_id', $companyId)
            ->where('job_id', $jobId)
            ->where('state_key', $stateKey)
            ->first();

        $payload = [
            'company_id' => $companyId,
            'user_id' => $userId,
            'team_id' => null,
            'created_by_team_id' => null,
            'job_id' => $jobId,
            'state_type' => 'compliance',
            'state_key' => $stateKey,
            'status' => $status,
            'score' => $score,
            'reasons_json' => !empty($reasons) ? json_encode($reasons) : null,
            'checked_at' => $now,
            'meta_json' => !empty($meta) ? json_encode($meta) : null,
            'updated_at' => $now,
        ];

        if ($existing) {
            DB::table('work_jobs_states')->where('id', $existing->id)->update(array_filter($payload, fn($v)=>$v!==null));
        } else {
            $payload['created_at'] = $now;
            DB::table('work_jobs_states')->insert(array_filter($payload, fn($v)=>$v!==null));
        }
    }
}

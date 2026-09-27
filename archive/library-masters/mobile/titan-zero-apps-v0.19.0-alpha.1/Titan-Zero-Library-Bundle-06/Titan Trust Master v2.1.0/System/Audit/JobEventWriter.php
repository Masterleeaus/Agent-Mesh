<?php

namespace App\Extensions\TitanTrust\System\Audit;

use Illuminate\Support\Facades\DB;

class JobEventWriter
{
    /**
     * Write a Doctrine v2 typed event into work_jobs_events.
     *
     * Required fields:
     * - company_id, user_id
     * - job_id
     * - event_type
     * - occurred_at
     */
    public static function write(
        int $companyId,
        int $userId,
        int $jobId,
        string $eventType,
        ?string $eventLabel = null,
        ?string $message = null,
        ?string $severity = null,
        array $meta = [],
        $occurredAt = null,
        ?int $teamId = null,
        ?int $createdByTeamId = null
    ): int {
        $occurredAt = $occurredAt ?: now();

        $payload = [
            'company_id' => $companyId,
            'user_id' => $userId,
            'team_id' => $teamId,
            'created_by_team_id' => $createdByTeamId,
            'job_id' => $jobId,
            'event_type' => $eventType,
            'event_label' => $eventLabel,
            'severity' => $severity,
            'message' => $message,
            'occurred_at' => $occurredAt,
            'meta_json' => !empty($meta) ? json_encode($meta) : null,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Remove nulls for compatibility (DB defaults / nullable cols)
        $payload = array_filter($payload, fn($v) => $v !== null);

        return (int) DB::table('work_jobs_events')->insertGetId($payload);
    }
}

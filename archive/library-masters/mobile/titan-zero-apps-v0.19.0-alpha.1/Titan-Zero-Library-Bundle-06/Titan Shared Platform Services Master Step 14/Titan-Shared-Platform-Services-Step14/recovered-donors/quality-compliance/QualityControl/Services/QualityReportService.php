<?php

namespace Modules\QualityControl\Services;

use Carbon\CarbonImmutable;
use InvalidArgumentException;
use Modules\QualityControl\Entities\QcRecord;
use Modules\QualityControl\Entities\Schedule;

/**
 * Generates a deterministic company-scoped quality summary for UI, AI and jobs.
 * Company context is explicit so the service is safe outside an Auth session.
 */
final class QualityReportService
{
    public function summarize(int $companyId, int $days = 30): array
    {
        if ($companyId < 1) {
            throw new InvalidArgumentException('company_id must be a positive integer.');
        }
        if ($days < 1 || $days > 366) {
            throw new InvalidArgumentException('days must be between 1 and 366.');
        }

        $since = CarbonImmutable::now()->subDays($days);

        $qc = QcRecord::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->where('created_at', '>=', $since)
            ->selectRaw("COUNT(*) as total,
                SUM(CASE WHEN status = 'pass' THEN 1 ELSE 0 END) as passed,
                SUM(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN reclean_triggered = 1 THEN 1 ELSE 0 END) as reclean,
                AVG(overall_score) as avg_score")
            ->first();

        $schedules = Schedule::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->where('created_at', '>=', $since)
            ->selectRaw("COUNT(*) as total,
                SUM(CASE WHEN qc_outcome = 'pass' THEN 1 ELSE 0 END) as passed,
                SUM(CASE WHEN qc_outcome IN ('fail','needs_reclean','escalated') THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN qc_outcome = 'needs_reclean' THEN 1 ELSE 0 END) as reclean")
            ->first();

        $qcTotal = (int) ($qc?->total ?? 0);
        $qcPassed = (int) ($qc?->passed ?? 0);
        $scheduleTotal = (int) ($schedules?->total ?? 0);
        $schedulePassed = (int) ($schedules?->passed ?? 0);

        return [
            'company_id' => $companyId,
            'period_days' => $days,
            'generated_at' => CarbonImmutable::now()->toIso8601String(),
            'qc_records' => [
                'total' => $qcTotal,
                'passed' => $qcPassed,
                'failed' => (int) ($qc?->failed ?? 0),
                'reclean' => (int) ($qc?->reclean ?? 0),
                'pass_rate' => $this->passRate($qcPassed, $qcTotal),
                'average_score' => $qc?->avg_score !== null ? round((float) $qc->avg_score, 1) : null,
            ],
            'inspection_schedules' => [
                'total' => $scheduleTotal,
                'passed' => $schedulePassed,
                'failed' => (int) ($schedules?->failed ?? 0),
                'reclean' => (int) ($schedules?->reclean ?? 0),
                'pass_rate' => $this->passRate($schedulePassed, $scheduleTotal),
            ],
        ];
    }

    private function passRate(int $passed, int $total): ?int
    {
        return $total > 0 ? (int) round(($passed / $total) * 100) : null;
    }
}

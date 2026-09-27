<?php

namespace Modules\QualityControl\Filament\Widgets;

use Filament\Widgets\Widget;
use Modules\QualityControl\Entities\QcRecord;
use Modules\QualityControl\Entities\Schedule;

final class QualityScoreboard extends Widget
{
    protected static ?string $heading = 'Quality Scoreboard';
    protected static ?int $sort = 10;
    protected string $view = 'quality_control::filament.widgets.quality-scoreboard';

    protected function getViewData(): array
    {
        $user = function_exists('user') ? user() : auth()->user();
        $companyId = (int) ($user->company_id ?? 0);
        if ($companyId < 1) {
            return $this->emptyData();
        }

        $since = now()->subDays(30);

        $schedules = Schedule::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->where('created_at', '>=', $since)
            ->selectRaw("COUNT(*) as total,
                SUM(CASE WHEN qc_outcome = 'pass' THEN 1 ELSE 0 END) as passed,
                SUM(CASE WHEN qc_outcome IN ('fail','needs_reclean','escalated') THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN qc_outcome = 'needs_reclean' THEN 1 ELSE 0 END) as reclean")
            ->first();

        $records = QcRecord::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->where('created_at', '>=', $since)
            ->selectRaw("COUNT(*) as total,
                SUM(CASE WHEN status = 'pass' THEN 1 ELSE 0 END) as passed,
                SUM(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN reclean_triggered = 1 THEN 1 ELSE 0 END) as reclean,
                AVG(overall_score) as avg_score")
            ->first();

        $scheduleTotal = (int) ($schedules?->total ?? 0);
        $schedulePassed = (int) ($schedules?->passed ?? 0);
        $qcTotal = (int) ($records?->total ?? 0);
        $qcPassed = (int) ($records?->passed ?? 0);

        return [
            'period' => '30 days',
            'insp_total' => $scheduleTotal,
            'insp_passed' => $schedulePassed,
            'insp_failed' => (int) ($schedules?->failed ?? 0),
            'insp_reclean' => (int) ($schedules?->reclean ?? 0),
            'insp_pass_rate' => $this->passRate($schedulePassed, $scheduleTotal),
            'qc_total' => $qcTotal,
            'qc_passed' => $qcPassed,
            'qc_failed' => (int) ($records?->failed ?? 0),
            'qc_reclean' => (int) ($records?->reclean ?? 0),
            'qc_pass_rate' => $this->passRate($qcPassed, $qcTotal),
            'qc_avg_score' => $records?->avg_score !== null ? round((float) $records->avg_score, 1) : null,
        ];
    }

    private function emptyData(): array
    {
        return [
            'period' => '30 days',
            'insp_total' => 0,
            'insp_passed' => 0,
            'insp_failed' => 0,
            'insp_reclean' => 0,
            'insp_pass_rate' => null,
            'qc_total' => 0,
            'qc_passed' => 0,
            'qc_failed' => 0,
            'qc_reclean' => 0,
            'qc_pass_rate' => null,
            'qc_avg_score' => null,
        ];
    }

    private function passRate(int $passed, int $total): ?int
    {
        return $total > 0 ? (int) round(($passed / $total) * 100) : null;
    }
}

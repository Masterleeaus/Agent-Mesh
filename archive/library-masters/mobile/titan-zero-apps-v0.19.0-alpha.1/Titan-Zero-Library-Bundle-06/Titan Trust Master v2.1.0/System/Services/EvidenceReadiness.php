<?php

declare(strict_types=1);

namespace App\Extensions\TitanTrust\System\Services;

use App\Extensions\TitanTrust\System\Models\WorkEvidenceItem;
use App\Extensions\TitanTrust\System\Models\WorkEvidenceRule;

class EvidenceReadiness
{
    /**
     * Compute readiness for a job_id, using the "best" matching rule for this tenant.
     *
     * Matching priority (best -> worst):
     *  1) template_id match (if provided)
     *  2) job_type + site_type match (if provided)
     *  3) job_type match
     *  4) site_type match
     *  5) default rule (all null)
     */
    public static function forJob(int $companyId, int $userId, int $jobId, ?int $templateId = null, ?string $jobType = null, ?string $siteType = null): array
    {
        $ruleQ = WorkEvidenceRule::query()
            ->where('company_id', $companyId);

        // pull all rules for tenant and score them
        $rules = $ruleQ->get();

        $best = null;
        $bestScore = -1;

        foreach ($rules as $r) {
            $score = 0;

            if ($templateId && (int) $r->template_id === $templateId) {
                $score = 100;
            } elseif ($jobType && $siteType && $r->job_type === $jobType && $r->site_type === $siteType) {
                $score = 80;
            } elseif ($jobType && $r->job_type === $jobType && empty($r->site_type)) {
                $score = 60;
            } elseif ($siteType && $r->site_type === $siteType && empty($r->job_type)) {
                $score = 40;
            } elseif (empty($r->template_id) && empty($r->job_type) && empty($r->site_type)) {
                $score = 10;
            }

            if ($score > $bestScore) {
                $best = $r;
                $bestScore = $score;
            }
        }

        $required = (array) ($best?->required ?? []);
        $required = array_merge([
            'before' => 0,
            'after' => 0,
            'incident' => 0,
            'signoff' => 0,
            'general' => 0,
        ], $required);

        $counts = WorkEvidenceItem::query()
            ->where('company_id', $companyId)
            ->where('job_id', $jobId)
            ->selectRaw('evidence_type, COUNT(*) as c')
            ->groupBy('evidence_type')
            ->pluck('c', 'evidence_type')
            ->toArray();

        $missing = [];
        $captured = [];
        $ready = true;

        foreach ($required as $type => $reqCount) {
            $reqCount = (int) $reqCount;
            $have = (int) ($counts[$type] ?? 0);
            $captured[$type] = $have;

            $need = max(0, $reqCount - $have);
            $missing[$type] = $need;

            if ($need > 0) {
                $ready = false;
            }
        }

        return [
            'rule' => $best ? [
                'id' => (int) $best->id,
                'template_id' => $best->template_id,
                'job_type' => $best->job_type,
                'site_type' => $best->site_type,
                'required' => $required,
            ] : null,
            'required' => $required,
            'captured' => $captured,
            'missing' => $missing,
            'ready' => $ready,
        ];
    }
}

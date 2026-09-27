<?php

namespace Modules\QualityControl\Actions;

use Modules\QualityControl\Domain\Quality\Actions\MarkNeedsRecleanAction;
use Modules\QualityControl\Entities\QcRecord;

/**
 * Canonical re-clean authorisation action.
 *
 * Authority/approval is decided before this action by TitanZeroAssurance. The
 * action itself performs only the company-scoped domain transition.
 */
final class AuthoriseReclean
{
    public function __construct(private readonly MarkNeedsRecleanAction $markNeedsReclean)
    {
    }

    public function execute(QcRecord $record, ?int $recleanJobId = null, ?string $reason = null): QcRecord
    {
        $record = $this->markNeedsReclean->handle($record, $reason);

        if ($recleanJobId !== null) {
            $record->reclean_job_id = $recleanJobId;
            $record->save();
        }

        event('quality_control.reclean_authorised', [
            'company_id' => (int) $record->company_id,
            'qc_record_id' => (int) $record->id,
            'reclean_job_id' => $recleanJobId,
        ]);

        return $record->fresh();
    }
}

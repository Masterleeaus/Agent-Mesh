<?php

namespace Modules\QualityControl\Domain\Quality\Actions;

use Modules\QualityControl\Entities\QcRecord;

final class MarkNeedsRecleanAction
{
    public function handle(QcRecord $record, ?string $reason = null): QcRecord
    {
        $record->status = 'reclean_required';
        $record->reclean_triggered = true;
        $record->reclean_triggered_at = now();

        if (property_exists($record, 'reclean_status')) {
            $record->reclean_status = 'requested';
        }

        if (!empty($reason)) {
            $record->notes = trim(($record->notes ? ($record->notes . PHP_EOL) : '') . 'Reclean reason: ' . $reason);
        }

        $record->save();

        return $record->fresh();
    }
}

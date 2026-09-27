<?php

namespace Modules\QualityControl\Domain\Quality\Actions;

use Modules\QualityControl\Entities\QcRecord;

final class EscalateQcIssueAction
{
    public function handle(QcRecord $record, ?string $note = null): QcRecord
    {
        $record->status = 'fail';

        if (property_exists($record, 'severity_level')) {
            $record->severity_level = 'critical';
        }

        if (!empty($note)) {
            $record->notes = trim(($record->notes ? ($record->notes . PHP_EOL) : '') . $note);
        }

        $record->save();

        return $record->fresh();
    }
}

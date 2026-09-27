<?php

namespace Modules\QualityControl\Domain\Quality\Actions;

use Modules\QualityControl\Entities\QcRecord;

final class PassQcRecordAction
{
    public function handle(QcRecord $record): QcRecord
    {
        $record->status = 'pass';
        $record->save();

        return $record->fresh();
    }
}

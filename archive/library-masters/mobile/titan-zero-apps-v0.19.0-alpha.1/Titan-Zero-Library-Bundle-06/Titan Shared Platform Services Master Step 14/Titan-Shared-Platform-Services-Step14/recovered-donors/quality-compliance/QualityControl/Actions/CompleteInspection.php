<?php

namespace Modules\QualityControl\Actions;

use Modules\QualityControl\Domain\Quality\Actions\ScoreQcRecordAction;
use Modules\QualityControl\Entities\QcRecord;

/**
 * Canonical completion action retained from the CleanQuality donor.
 *
 * The historical donor wrote to a second `inspections` aggregate. Pass 2
 * deliberately targets qc_records so there is only one quality result store.
 */
final class CompleteInspection
{
    public function __construct(private readonly ScoreQcRecordAction $scoreAction)
    {
    }

    public function execute(QcRecord $record, array $attributes = []): QcRecord
    {
        $record->fill(array_intersect_key($attributes, array_flip([
            'notes',
            'inspected_by',
            'inspected_at',
            'severity_level',
            'site_id',
            'team_id',
            'service_type',
        ])));

        if (!$record->inspected_at) {
            $record->inspected_at = now();
        }

        $record->save();

        return $this->scoreAction->handle($record);
    }
}

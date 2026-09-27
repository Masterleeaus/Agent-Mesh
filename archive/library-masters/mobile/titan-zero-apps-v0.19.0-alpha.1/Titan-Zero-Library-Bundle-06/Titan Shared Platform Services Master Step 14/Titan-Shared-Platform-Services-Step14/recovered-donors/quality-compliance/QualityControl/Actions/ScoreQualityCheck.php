<?php

namespace Modules\QualityControl\Actions;

use Modules\QualityControl\Domain\Quality\Actions\ScoreQcRecordAction;
use Modules\QualityControl\Entities\QcRecord;

/**
 * Stable action-shaped API for AI/tools and orchestration layers.
 */
final class ScoreQualityCheck
{
    public function __construct(private readonly ScoreQcRecordAction $scoreAction)
    {
    }

    public function execute(QcRecord $record): QcRecord
    {
        return $this->scoreAction->handle($record);
    }
}

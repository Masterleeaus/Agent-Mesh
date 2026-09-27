<?php

namespace Modules\QualityControl\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\QualityControl\Entities\QcRecord;

class QcFailedEvent
{
    use Dispatchable, SerializesModels;

    public readonly int $qcRecordId;
    public readonly ?int $siteId;
    public readonly ?int $teamId;
    public readonly ?string $severityLevel;
    public readonly int $riskScore;
    public readonly int $companyId;
    public readonly string $triggerSource;

    public function __construct(QcRecord $record, string $triggerSource = 'system')
    {
        $this->qcRecordId    = $record->id;
        $this->siteId        = $record->site_id ?? null;
        $this->teamId        = $record->team_id ?? null;
        $this->severityLevel = $record->severity_level ?? null;
        $this->riskScore     = (int) ($record->risk_score ?? 0);
        $this->companyId     = (int) ($record->company_id ?? 0);
        if ($this->companyId <= 0) { throw new \LogicException('QualityControl event requires company_id.'); }
        $this->triggerSource = $triggerSource;
    }
}

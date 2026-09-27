<?php

namespace Modules\QualityControl\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\QualityControl\Entities\QcCorrectiveAction;

class CorrectiveActionAssignedEvent
{
    use Dispatchable, SerializesModels;

    public readonly int $correctiveActionId;
    public readonly ?int $qcRecordId;
    public readonly ?int $ownerId;
    public readonly ?string $severityLevel;
    public readonly int $companyId;
    public readonly string $triggerSource;

    public function __construct(QcCorrectiveAction $action, string $triggerSource = 'system')
    {
        $this->correctiveActionId = $action->id;
        $this->qcRecordId         = $action->qc_record_id ?? null;
        $this->ownerId            = $action->owner_id ?? null;
        $this->severityLevel      = $action->severity_level ?? null;
        $this->companyId          = $action->company_id ?? null;
        $this->triggerSource      = $triggerSource;
    }
}

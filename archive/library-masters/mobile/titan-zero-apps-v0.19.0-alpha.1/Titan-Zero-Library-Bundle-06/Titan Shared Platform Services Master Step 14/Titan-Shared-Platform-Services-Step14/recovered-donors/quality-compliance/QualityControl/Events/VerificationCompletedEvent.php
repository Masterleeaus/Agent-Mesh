<?php

namespace Modules\QualityControl\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\QualityControl\Entities\QcFollowupVerification;

class VerificationCompletedEvent
{
    use Dispatchable, SerializesModels;

    public readonly int $verificationId;
    public readonly ?int $qcRecordId;
    public readonly ?int $scheduleId;
    public readonly ?int $complaintId;
    public readonly ?int $verifiedBy;
    public readonly int $companyId;
    public readonly string $triggerSource;

    public function __construct(QcFollowupVerification $verification, string $triggerSource = 'system')
    {
        $this->verificationId = $verification->id;
        $this->qcRecordId     = $verification->qc_record_id ?? null;
        $this->scheduleId     = $verification->schedule_id ?? null;
        $this->complaintId    = $verification->complaint_id ?? null;
        $this->verifiedBy     = $verification->verified_by ?? null;
        $this->companyId      = $verification->company_id ?? null;
        $this->triggerSource  = $triggerSource;
    }
}

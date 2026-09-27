<?php

namespace Modules\QualityControl\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Modules\QualityControl\Entities\QcCorrectiveAction;

class CorrectiveActionAssignedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly QcCorrectiveAction $action)
    {
    }

    public function build(): static
    {
        $subject = sprintf(
            '[QC] Corrective Action Assigned — %s',
            $this->action->title ?? 'Action Required'
        );

        return $this
            ->subject($subject)
            ->view('quality_control::mail.corrective_action_assigned');
    }
}

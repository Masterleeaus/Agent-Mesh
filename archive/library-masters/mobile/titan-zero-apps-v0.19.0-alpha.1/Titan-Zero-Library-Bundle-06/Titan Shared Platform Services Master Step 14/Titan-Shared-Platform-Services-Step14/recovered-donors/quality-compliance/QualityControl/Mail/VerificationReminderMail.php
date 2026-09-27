<?php

namespace Modules\QualityControl\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Modules\QualityControl\Entities\QcFollowupVerification;

class VerificationReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly QcFollowupVerification $verification)
    {
    }

    public function build(): static
    {
        return $this
            ->subject('[QC] Verification Reminder — Action Required')
            ->view('quality_control::mail.verification_reminder');
    }
}

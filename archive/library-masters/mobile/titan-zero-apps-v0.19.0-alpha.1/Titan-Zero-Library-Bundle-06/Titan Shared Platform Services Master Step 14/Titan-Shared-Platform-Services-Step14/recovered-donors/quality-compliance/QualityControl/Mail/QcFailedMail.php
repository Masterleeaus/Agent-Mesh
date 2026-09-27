<?php

namespace Modules\QualityControl\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Modules\QualityControl\Entities\QcRecord;

class QcFailedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly QcRecord $record)
    {
    }

    public function build(): static
    {
        $subject = sprintf(
            '[QC Alert] Inspection Failed — Score %d%% — %s',
            $this->record->overall_score ?? 0,
            $this->record->severity_level ? strtoupper($this->record->severity_level) : 'UNKNOWN SEVERITY'
        );

        return $this
            ->subject($subject)
            ->view('quality_control::mail.qc_failed');
    }
}

<?php

declare(strict_types=1);

namespace Modules\QualityControl\Domain\Quality\Actions;

use Modules\CustomerFeedback\Actions\CreateComplaintAction;
use Modules\CustomerFeedback\Entities\FeedbackTicket;
use Modules\QualityControl\Entities\QcRecord;

final class CreateComplaintFromQcFailureAction
{
    public function __construct(private readonly CreateComplaintAction $createComplaint) {}

    public function handle(QcRecord $record): ?int
    {
        if (!class_exists(FeedbackTicket::class) || (int) $record->company_id <= 0) return null;
        if (!empty($record->complaint_id)) return (int) $record->complaint_id;

        $userId = (int) ($record->cleaner_id ?: 0);
        if ($userId <= 0 && function_exists('user') && user()) $userId = (int) user()->id;
        if ($userId <= 0) return null;

        $ticket = $this->createComplaint->execute([
            'company_id' => (int) $record->company_id,
            'user_id' => $userId,
            'title' => 'QC Failure Follow-up',
            'description' => 'Auto-created from failed QC record #' . $record->id,
            'priority' => FeedbackTicket::PRIORITY_HIGH,
            'quality_control_id' => $record->schedule_id,
            'quality_control_reason' => 'Failed QC record #' . $record->id,
            'job_id' => $record->booking_id,
            'complaint_source' => 'internal',
            'requires_investigation' => true,
            'custom_meta' => ['qc_record_id' => (int) $record->id],
        ]);

        $record->complaint_id = $ticket->id;
        $record->save();
        return (int) $ticket->id;
    }
}

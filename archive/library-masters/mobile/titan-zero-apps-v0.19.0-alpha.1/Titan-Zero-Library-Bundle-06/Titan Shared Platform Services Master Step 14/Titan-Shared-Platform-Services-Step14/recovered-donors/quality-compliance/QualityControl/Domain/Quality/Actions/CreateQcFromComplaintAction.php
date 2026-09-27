<?php

namespace Modules\QualityControl\Domain\Quality\Actions;

use Modules\CustomerFeedback\Entities\FeedbackTicket;
use Modules\QualityControl\Events\VerificationScheduledEvent;
use Modules\QualityControl\Entities\QcFollowupVerification;

final class CreateQcFromComplaintAction
{
    public function handle(FeedbackTicket $complaint): ?int
    {
        if (!class_exists('Modules\\QualityControl\\Entities\\Schedule') || empty($complaint->quality_control_id)) {
            return null;
        }

        if (!empty($complaint->follow_up_schedule_id)) {
            return (int) $complaint->follow_up_schedule_id;
        }

        $scheduleClass = 'Modules\\QualityControl\\Entities\\Schedule';
        $source = $scheduleClass::withoutGlobalScopes()->where('company_id', (int) $complaint->company_id)->find($complaint->quality_control_id);

        if (!$source) {
            return null;
        }

        // Tenancy guard: prevent cross-company data leakage.
        if (
            isset($source->company_id) &&
            isset($complaint->company_id) &&
            (string) $source->company_id !== (string) $complaint->company_id
        ) {
            return null;
        }

        $follow = new $scheduleClass();
        $follow->company_id = $source->company_id;
        $follow->subject = 'Follow-up: ' . ($source->subject ?: 'Inspection');
        $follow->tower_id = $source->tower_id ?? null;
        $follow->floor_id = $source->floor_id ?? null;
        $follow->lokasi = $source->lokasi ?? null;
        $follow->shift = $source->shift ?? null;
        $follow->awal = $source->awal ?? null;
        $follow->akhir = $source->akhir ?? null;
        $follow->worker_id = $source->worker_id ?? null;
        $follow->agent_id = $source->agent_id ?? null;
        $follow->issue_date = now()->addDay()->format('Y-m-d');
        $follow->job_id = $source->job_id ?? ($complaint->job_id ?? null);
        $follow->complaint_id = $complaint->id;
        $follow->qc_outcome = 'pending';
        $follow->qc_outcome_set_at = null;
        $follow->save();

        $itemClass = 'Modules\\QualityControl\\Entities\\ScheduleItems';
        if (class_exists($itemClass) && method_exists($source, 'items')) {
            foreach ($source->items as $item) {
                $itemClass::create([
                    'schedule_id' => $follow->id,
                    'item_name' => $item->item_name,
                ]);
            }
        }

        $complaint->follow_up_schedule_id = $follow->id;
        $complaint->save();

        $source->follow_up_schedule_id = $follow->id;
        $source->save();

        // Schedule a follow-up verification and emit event.
        try {
            $verification = QcFollowupVerification::create([
                'company_id'   => $follow->company_id,
                'schedule_id'  => $follow->id,
                'complaint_id' => $complaint->id,
                'status'       => 'queued',
                'due_at'       => now()->addHours(
                    (int) config('quality_control.qc_verification_reminder_hours', 24)
                ),
            ]);

            VerificationScheduledEvent::dispatch($verification, 'create_qc_from_complaint');
        } catch (\Throwable) {
            // Non-fatal — verification scheduling failure should not block follow-up creation.
        }

        return (int) $follow->id;
    }
}

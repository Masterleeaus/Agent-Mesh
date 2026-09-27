<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\Listeners;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Modules\CustomerFeedback\Actions\CreateComplaintAction;
use Modules\CustomerFeedback\Entities\FeedbackTicket;

final class QualityControlNeedsRecleanListener
{
    public function __construct(private readonly CreateComplaintAction $createComplaint) {}

    public function handle(mixed $payload): void
    {
        $data = is_array($payload) ? $payload : (array) $payload;
        $companyId = (int) Arr::get($data, 'company_id', 0);
        $userId = (int) Arr::get($data, 'user_id', 0);
        $qualityControlId = (int) Arr::get($data, 'quality_control_id', 0);
        if ($companyId <= 0 || $userId <= 0 || $qualityControlId <= 0) {
            Log::warning('[CustomerFeedback] quality_control.needs_reclean missing company/user/quality_control context', ['payload' => $data]);
            return;
        }

        $existing = FeedbackTicket::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->where('feedback_type', FeedbackTicket::TYPE_COMPLAINT)
            ->where('quality_control_id', $qualityControlId)
            ->first();
        if ($existing) {
            $this->backlinkSchedule($existing, $companyId, $qualityControlId);
            return;
        }

        $title = 'Re-clean required';
        if (class_exists('Modules\QualityControl\Entities\Schedule')) {
            try {
                $schedule = \Modules\QualityControl\Entities\Schedule::withoutGlobalScopes()
                    ->where('company_id', $companyId)
                    ->find($qualityControlId);
                if ($schedule && !empty($schedule->subject)) {
                    $title .= ': ' . $schedule->subject;
                }
            } catch (\Throwable) {
            }
        }

        $ticket = $this->createComplaint->execute([
            'company_id' => $companyId,
            'user_id' => $userId,
            'agent_id' => Arr::get($data, 'agent_id'),
            'title' => $title,
            'description' => (string) Arr::get($data, 'reason', 'Quality verification requires re-clean.'),
            'priority' => FeedbackTicket::PRIORITY_HIGH,
            'quality_control_id' => $qualityControlId,
            'quality_control_reason' => (string) Arr::get($data, 'reason', 'needs_reclean'),
            'job_id' => Arr::get($data, 'job_id'),
            'complaint_source' => 'internal',
            'requires_investigation' => true,
        ]);
        $this->backlinkSchedule($ticket, $companyId, $qualityControlId);
    }

    private function backlinkSchedule(FeedbackTicket $ticket, int $companyId, int $qualityControlId): void
    {
        if (!class_exists('Modules\QualityControl\Entities\Schedule')) {
            return;
        }
        try {
            $schedule = \Modules\QualityControl\Entities\Schedule::withoutGlobalScopes()
                ->where('company_id', $companyId)
                ->find($qualityControlId);
            if ($schedule && empty($schedule->complaint_id)) {
                $schedule->complaint_id = $ticket->id;
                $schedule->save();
            }
        } catch (\Throwable $e) {
            Log::debug('[CustomerFeedback] failed to backlink quality schedule', ['error' => $e->getMessage()]);
        }
    }
}

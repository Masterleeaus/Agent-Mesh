<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\Actions;

use Illuminate\Support\Facades\DB;
use Modules\CustomerFeedback\Entities\FeedbackTicket;
use Modules\CustomerFeedback\Events\ComplaintReceived;
use Modules\CustomerFeedback\Events\FeedbackTicketCreated;
use Modules\CustomerFeedback\Services\ComplaintAnalysisService;
use Modules\CustomerFeedback\Services\ComplaintSlaPolicy;

final class CreateComplaintAction
{
    public function __construct(
        private readonly ComplaintAnalysisService $analysis,
        private readonly ComplaintSlaPolicy $sla,
    ) {
    }

    /** @param array<string,mixed> $data */
    public function execute(array $data): FeedbackTicket
    {
        $companyId = (int) ($data['company_id'] ?? 0);
        $userId = (int) ($data['user_id'] ?? 0);
        $title = trim((string) ($data['title'] ?? $data['subject'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));
        if ($companyId <= 0) {
            throw new \InvalidArgumentException('company_id is required to create a complaint.');
        }
        if ($userId <= 0) {
            throw new \InvalidArgumentException('user_id is required to create a complaint.');
        }
        if ($title === '') {
            throw new \InvalidArgumentException('Complaint title is required.');
        }

        return DB::transaction(function () use ($data, $companyId, $userId, $title, $description): FeedbackTicket {
            $result = $this->analysis->analyse($title, $description);
            $priority = (string) ($data['priority'] ?? match ($result['severity']) {
                'urgent' => FeedbackTicket::PRIORITY_CRITICAL,
                'high' => FeedbackTicket::PRIORITY_HIGH,
                'low' => FeedbackTicket::PRIORITY_LOW,
                default => FeedbackTicket::PRIORITY_MEDIUM,
            });

            $ticket = new FeedbackTicket();
            $ticket->company_id = $companyId;
            $ticket->user_id = $userId;
            $ticket->agent_id = $data['agent_id'] ?? null;
            $ticket->title = $title;
            $ticket->description = $description !== '' ? $description : $title;
            $ticket->feedback_type = FeedbackTicket::TYPE_COMPLAINT;
            $ticket->status = FeedbackTicket::STATUS_OPEN;
            $ticket->priority = $priority;
            $ticket->channel_id = $data['channel_id'] ?? null;
            $ticket->group_id = $data['group_id'] ?? null;
            $ticket->type_id = $data['type_id'] ?? null;
            $ticket->quality_control_id = $data['quality_control_id'] ?? null;
            $ticket->quality_control_reason = $data['quality_control_reason'] ?? null;
            $ticket->job_id = $data['job_id'] ?? null;
            $ticket->complaint_source = (string) ($data['complaint_source'] ?? 'client');
            $ticket->requires_investigation = (bool) ($data['requires_investigation'] ?? in_array($priority, [FeedbackTicket::PRIORITY_HIGH, FeedbackTicket::PRIORITY_CRITICAL], true));
            $ticket->sla_due_at = $this->sla->dueAt($priority)->format('Y-m-d H:i:s');
            $ticket->ai_metadata = array_merge((array) ($data['ai_metadata'] ?? []), ['complaint_analysis' => $result]);
            $ticket->custom_meta = array_merge((array) ($data['custom_meta'] ?? []), ['canonical_domain' => 'feedback_resolution']);
            $ticket->save();

            FeedbackTicketCreated::dispatch($ticket);
            ComplaintReceived::dispatch($ticket);
            return $ticket;
        });
    }
}

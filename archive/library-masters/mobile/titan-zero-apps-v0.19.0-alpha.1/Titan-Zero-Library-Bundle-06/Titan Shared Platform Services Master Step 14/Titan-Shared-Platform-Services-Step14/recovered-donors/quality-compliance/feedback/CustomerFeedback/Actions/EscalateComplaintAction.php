<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\Actions;

use Modules\CustomerFeedback\Entities\FeedbackReply;
use Modules\CustomerFeedback\Entities\FeedbackTicket;
use Modules\CustomerFeedback\Events\ComplaintEscalated;
use Modules\CustomerFeedback\Events\FeedbackTicketUpdated;
use Modules\CustomerFeedback\Services\FeedbackWorkItemService;

final class EscalateComplaintAction
{
    public function __construct(private readonly FeedbackWorkItemService $workItems)
    {
    }

    /** @param list<string> $grantedCapabilities */
    public function execute(FeedbackTicket $ticket, ?string $reason = null, array $grantedCapabilities = []): FeedbackTicket
    {
        if (!$ticket->isComplaint()) {
            throw new \LogicException('Only complaint tickets may be escalated.');
        }
        if ($ticket->isResolved()) {
            throw new \LogicException('Resolved complaints cannot be escalated.');
        }

        $ticket->status = FeedbackTicket::STATUS_PENDING;
        $ticket->priority = FeedbackTicket::PRIORITY_HIGH;
        $ticket->escalated_at = now();
        $ticket->escalation_reason = $reason !== null ? trim($reason) : null;
        $ticket->requires_investigation = true;
        $ticket->save();

        if ($reason !== null && trim($reason) !== '') {
            $reply = new FeedbackReply();
            $reply->company_id = (int) $ticket->company_id;
            $reply->feedback_id = (int) $ticket->id;
            $reply->user_id = (int) (function_exists('user') && user() ? user()->id : $ticket->user_id);
            $reply->message = trim($reason);
            $reply->message_html = trim($reason);
            $reply->is_internal = true;
            $reply->source_channel = FeedbackReply::SOURCE_AUTO;
            $reply->save();
        }

        FeedbackTicketUpdated::dispatch($ticket);
        ComplaintEscalated::dispatch($ticket, $reason);
        $result = $this->workItems->requestCorrectiveWork($ticket, $grantedCapabilities, ['reason' => $reason], 'investigate_complaint', 'medium');
        if (!empty($result['work_item_id'])) {
            $ticket->corrective_work_item_id = (string) $result['work_item_id'];
            $ticket->save();
        }

        return $ticket;
    }
}

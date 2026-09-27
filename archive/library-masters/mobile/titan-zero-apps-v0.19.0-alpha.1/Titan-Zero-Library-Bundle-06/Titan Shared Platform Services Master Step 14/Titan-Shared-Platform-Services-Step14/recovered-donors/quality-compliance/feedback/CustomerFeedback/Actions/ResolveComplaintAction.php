<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\Actions;

use Modules\CustomerFeedback\Entities\FeedbackTicket;
use Modules\CustomerFeedback\Events\ComplaintResolved;
use Modules\CustomerFeedback\Events\FeedbackTicketUpdated;

final class ResolveComplaintAction
{
    /** @param array<string,mixed> $data */
    public function execute(FeedbackTicket $ticket, array $data = []): FeedbackTicket
    {
        if (!$ticket->isComplaint()) {
            throw new \LogicException('Only complaint tickets may use the complaint resolution action.');
        }

        $ticket->status = FeedbackTicket::STATUS_RESOLVED;
        $ticket->resolved_at = now();
        $ticket->resolved_by = $data['resolved_by'] ?? (function_exists('user') && user() ? user()->id : null);
        $ticket->resolution_outcome = isset($data['resolution_outcome']) ? (string) $data['resolution_outcome'] : $ticket->resolution_outcome;
        $ticket->resolution_type = isset($data['resolution_type']) ? (string) $data['resolution_type'] : $ticket->resolution_type;
        $ticket->refund_amount = $data['refund_amount'] ?? $ticket->refund_amount;
        $ticket->save();

        FeedbackTicketUpdated::dispatch($ticket);
        ComplaintResolved::dispatch($ticket);
        return $ticket;
    }
}

<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\Observers;

use Modules\CustomerFeedback\Entities\FeedbackTicket;
use Modules\CustomerFeedback\Support\CompanyContext;

final class FeedbackTicketObserver
{
    public function creating(FeedbackTicket $ticket): void
    {
        $ticket->company_id = CompanyContext::require(isset($ticket->company_id) ? (int) $ticket->company_id : null);
    }

    public function updating(FeedbackTicket $ticket): void
    {
        if ($ticket->isDirty('status') && in_array($ticket->status, [FeedbackTicket::STATUS_RESOLVED, FeedbackTicket::STATUS_CLOSED], true)) {
            $ticket->resolved_at ??= now();
        }
    }
}

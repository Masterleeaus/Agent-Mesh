<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\Observers;

use Modules\CustomerFeedback\Entities\FeedbackReply;
use Modules\CustomerFeedback\Support\CompanyContext;

final class FeedbackReplyObserver
{
    public function creating(FeedbackReply $reply): void
    {
        $reply->company_id = CompanyContext::require(isset($reply->company_id) ? (int) $reply->company_id : null);
    }

    public function created(FeedbackReply $reply): void
    {
        $ticket = $reply->ticket()->withoutGlobalScopes()->where('company_id', (int) $reply->company_id)->first();
        if ($ticket) $ticket->update(['read' => true, 'updated_at' => now()]);
    }
}

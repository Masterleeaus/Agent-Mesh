<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\CustomerFeedback\Entities\FeedbackTicket;

final class ComplaintResolved
{
    use Dispatchable, SerializesModels;

    public const SIGNAL = 'feedback.complaint.resolved';

    public function __construct(public FeedbackTicket $ticket) {}
}

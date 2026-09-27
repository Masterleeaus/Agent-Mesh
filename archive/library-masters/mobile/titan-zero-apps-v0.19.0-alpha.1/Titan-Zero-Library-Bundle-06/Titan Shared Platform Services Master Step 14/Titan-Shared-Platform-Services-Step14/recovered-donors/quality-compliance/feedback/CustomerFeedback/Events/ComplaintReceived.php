<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\CustomerFeedback\Entities\FeedbackTicket;

final class ComplaintReceived
{
    use Dispatchable, SerializesModels;

    public const SIGNAL = 'feedback.complaint.received';

    public function __construct(public FeedbackTicket $ticket) {}
}

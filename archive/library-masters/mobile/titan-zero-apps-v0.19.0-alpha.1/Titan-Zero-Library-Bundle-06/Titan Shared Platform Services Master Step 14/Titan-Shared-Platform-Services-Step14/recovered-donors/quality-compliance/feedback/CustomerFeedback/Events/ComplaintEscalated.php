<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\CustomerFeedback\Entities\FeedbackTicket;

final class ComplaintEscalated
{
    use Dispatchable, SerializesModels;

    public const SIGNAL = 'feedback.complaint.escalated';

    public function __construct(public FeedbackTicket $ticket, public ?string $reason = null) {}
}

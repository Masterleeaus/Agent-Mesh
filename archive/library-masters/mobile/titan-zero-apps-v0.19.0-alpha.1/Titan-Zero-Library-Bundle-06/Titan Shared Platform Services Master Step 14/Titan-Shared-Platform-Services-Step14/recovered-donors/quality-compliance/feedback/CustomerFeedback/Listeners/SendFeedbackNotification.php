<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\Listeners;

use Modules\CustomerFeedback\Entities\FeedbackTicket;
use Modules\CustomerFeedback\Notifications\NewFeedbackTicket;

final class SendFeedbackNotification
{
    public function handle(object $event): void
    {
        $ticket = $event->ticket ?? ($event->reply->ticket ?? null);
        if (!$ticket instanceof FeedbackTicket) return;

        if ($ticket->agent_id && $ticket->agent) {
            $ticket->agent->notify(new NewFeedbackTicket($ticket));
        }
        if ($ticket->group_id && $ticket->group) {
            foreach ($ticket->group->enabledAgents as $agent) {
                $user = $agent->user ?? $agent;
                if ($user && method_exists($user, 'notify')) $user->notify(new NewFeedbackTicket($ticket));
            }
        }
    }
}

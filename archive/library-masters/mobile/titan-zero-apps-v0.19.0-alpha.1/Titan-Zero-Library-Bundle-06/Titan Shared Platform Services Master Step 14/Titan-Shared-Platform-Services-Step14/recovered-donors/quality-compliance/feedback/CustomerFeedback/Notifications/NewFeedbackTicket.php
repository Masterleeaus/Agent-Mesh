<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Modules\CustomerFeedback\Entities\FeedbackTicket;

final class NewFeedbackTicket extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly FeedbackTicket $ticket) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('New feedback ticket #' . $this->ticket->id)
            ->line($this->ticket->title)
            ->line('Priority: ' . $this->ticket->priority);
    }
}

<?php

namespace Modules\CustomerFeedback\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\CustomerFeedback\Events\FeedbackTicketCreated;
use Modules\CustomerFeedback\Events\FeedbackTicketUpdated;
use Modules\CustomerFeedback\Events\FeedbackReplyAdded;
use Modules\CustomerFeedback\Events\NpsSurveyCreated;
use Modules\CustomerFeedback\Events\ComplaintReceived;
use Modules\CustomerFeedback\Events\ComplaintEscalated;
use Modules\CustomerFeedback\Listeners\AssuranceComplaintReceivedListener;
use Modules\CustomerFeedback\Listeners\AssuranceComplaintEscalatedListener;
use Modules\CustomerFeedback\Listeners\SendFeedbackNotification;
use Modules\CustomerFeedback\Listeners\TriggerFeedbackAnalysis;
use Modules\CustomerFeedback\Listeners\QualityControlNeedsRecleanListener;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        FeedbackTicketCreated::class => [
            SendFeedbackNotification::class,
            TriggerFeedbackAnalysis::class,
        ],
        FeedbackTicketUpdated::class => [
            SendFeedbackNotification::class,
        ],
        FeedbackReplyAdded::class => [
            SendFeedbackNotification::class,
        ],
        NpsSurveyCreated::class => [],
        ComplaintReceived::class => [AssuranceComplaintReceivedListener::class],
        ComplaintEscalated::class => [AssuranceComplaintEscalatedListener::class],
        'quality_control.needs_reclean' => [
            QualityControlNeedsRecleanListener::class,
        ],
    ];

    public function boot()
    {
        parent::boot();
    }
}

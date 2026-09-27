<?php

namespace Modules\QualityControl\Providers;

use App\Events\NewCompanyCreatedEvent;

use Modules\QualityControl\Entities\Schedule;
use Modules\QualityControl\Listeners\CompanyCreatedListener;
use Modules\QualityControl\Entities\RecurringSchedule;
use Modules\QualityControl\Observers\ScheduleObserver;
use Modules\QualityControl\Observers\ScheduleRecurringObserver;
use Modules\QualityControl\Events\QcFailedEvent;
use Modules\QualityControl\Events\QcSeverityExceededEvent;
use Modules\QualityControl\Events\CorrectiveActionAssignedEvent;
use Modules\QualityControl\Events\CorrectiveActionOverdueEvent;
use Modules\QualityControl\Events\VerificationScheduledEvent;
use Modules\QualityControl\Events\VerificationCompletedEvent;
use Modules\QualityControl\Listeners\QcFailedListener;
use Modules\QualityControl\Listeners\AssuranceQcFailedListener;
use Modules\QualityControl\Listeners\QcSeverityExceededListener;
use Modules\QualityControl\Listeners\CorrectiveActionAssignedListener;
use Modules\QualityControl\Listeners\CorrectiveActionOverdueListener;
use Modules\QualityControl\Listeners\VerificationScheduledListener;
use Modules\QualityControl\Listeners\VerificationCompletedListener;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;



class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array
     */
    protected $listen = [

        NewCompanyCreatedEvent::class => [CompanyCreatedListener::class],

        // QC lifecycle events
        QcFailedEvent::class => [QcFailedListener::class, AssuranceQcFailedListener::class],
        QcSeverityExceededEvent::class => [QcSeverityExceededListener::class],
        CorrectiveActionAssignedEvent::class => [CorrectiveActionAssignedListener::class],
        CorrectiveActionOverdueEvent::class => [CorrectiveActionOverdueListener::class],
        VerificationScheduledEvent::class => [VerificationScheduledListener::class],
        VerificationCompletedEvent::class => [VerificationCompletedListener::class],

    ];



    protected $observers = [
        RecurringSchedule::class => [ScheduleRecurringObserver::class],
        Schedule::class => [ScheduleObserver::class],
    ];

}

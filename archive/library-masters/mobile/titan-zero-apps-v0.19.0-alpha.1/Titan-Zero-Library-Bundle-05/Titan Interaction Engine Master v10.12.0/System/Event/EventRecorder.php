<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Event;

use App\Extensions\InteractionEngine\System\Contracts\EventRecorderInterface;
use App\Extensions\InteractionEngine\System\Events\InteractionEventRecorded;
use App\Extensions\InteractionEngine\System\Models\InteractionEvent;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;

final class EventRecorder implements EventRecorderInterface
{
    public function __construct(private readonly CompanyExecutionContext $tenantContext)
    {
    }

    public function record(string $eventType, array $data): void
    {
        $companyId = $this->tenantContext->companyId();
        $data['company_id'] = $companyId;

        $event = new InteractionEvent([
            'company_id' => $companyId,
            'run_id' => $data['run_id'] ?? null,
            'event_type' => $eventType,
            'data' => $data,
            'occurred_at' => date('Y-m-d H:i:s'),
        ]);
        $event->save();
        if (function_exists('event')) {
            event(new InteractionEventRecorded($eventType, $data));
        }
    }

    public function getEvents(int $runId): array
    {
        return InteractionEvent::query()
            ->where('company_id', $this->tenantContext->companyId())
            ->where('run_id', $runId)
            ->orderBy('occurred_at')
            ->limit(5000)->get()
            ->toArray();
    }
}

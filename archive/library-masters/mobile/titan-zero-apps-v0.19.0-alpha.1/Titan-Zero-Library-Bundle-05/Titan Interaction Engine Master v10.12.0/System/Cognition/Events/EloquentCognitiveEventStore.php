<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Cognition\Events;

use App\Extensions\InteractionEngine\System\Models\CognitiveEvent as CognitiveEventModel;

final class EloquentCognitiveEventStore implements CognitiveEventStoreInterface
{
    public function append(CognitiveEvent $event): void
    {
        CognitiveEventModel::query()->firstOrCreate(
            ['company_id' => $event->companyId, 'event_id' => $event->eventId],
            array_replace($event->toArray(), ['company_id' => $event->companyId]),
        );
    }

    public function find(string $companyId, string $eventId): ?CognitiveEvent
    {
        $row = CognitiveEventModel::query()->where('company_id', $companyId)->where('event_id', $eventId)->first();
        return $row === null ? null : CognitiveEvent::fromArray($this->normalise($row->toArray()));
    }

    public function forCorrelation(string $companyId, string $correlationId): array
    {
        return CognitiveEventModel::query()
            ->where('company_id', $companyId)
            ->where('correlation_id', $correlationId)
            ->orderBy('sequence')
            ->orderBy('occurred_at')
            ->orderBy('event_id')
            ->limit(5000)->get()
            ->map(fn (CognitiveEventModel $row): CognitiveEvent => CognitiveEvent::fromArray($this->normalise($row->toArray())))
            ->all();
    }

    private function normalise(array $data): array
    {
        foreach (['occurred_at', 'recorded_at'] as $field) {
            if (isset($data[$field]) && is_object($data[$field]) && method_exists($data[$field], 'toAtomString')) {
                $data[$field] = $data[$field]->toAtomString();
            }
        }
        return $data;
    }
}

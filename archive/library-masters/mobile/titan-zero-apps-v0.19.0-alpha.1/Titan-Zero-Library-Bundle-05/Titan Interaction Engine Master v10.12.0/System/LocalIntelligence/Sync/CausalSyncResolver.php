<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\LocalIntelligence\Sync;

final class CausalSyncResolver
{
    /**
     * @param array{clock?: array<string,int>, updated_at?: string, payload?: array<string,mixed>} $local
     * @param array{clock?: array<string,int>, updated_at?: string, payload?: array<string,mixed>} $remote
     * @param list<string> $lastWriterWinsFields
     * @return array{relation: string, state: array<string,mixed>, conflicts: list<array<string,mixed>>}
     */
    public function resolve(array $local, array $remote, array $lastWriterWinsFields = []): array
    {
        $localClock = new VectorClock((array) ($local['clock'] ?? []));
        $remoteClock = new VectorClock((array) ($remote['clock'] ?? []));
        $relation = $localClock->compare($remoteClock);

        if ($relation === 'before') {
            return ['relation' => $relation, 'state' => $remote, 'conflicts' => []];
        }
        if ($relation === 'after') {
            return ['relation' => $relation, 'state' => $local, 'conflicts' => []];
        }

        $localPayload = (array) ($local['payload'] ?? []);
        $remotePayload = (array) ($remote['payload'] ?? []);
        $fields = array_unique(array_merge(array_keys($localPayload), array_keys($remotePayload)));
        $mergedPayload = [];
        $conflicts = [];
        $remoteIsLater = $this->timestamp($remote['updated_at'] ?? null) > $this->timestamp($local['updated_at'] ?? null);

        foreach ($fields as $field) {
            $hasLocal = array_key_exists($field, $localPayload);
            $hasRemote = array_key_exists($field, $remotePayload);
            if (!$hasLocal) {
                $mergedPayload[$field] = $remotePayload[$field];
                continue;
            }
            if (!$hasRemote || $localPayload[$field] === $remotePayload[$field]) {
                $mergedPayload[$field] = $localPayload[$field];
                continue;
            }
            if (in_array($field, $lastWriterWinsFields, true)) {
                $mergedPayload[$field] = $remoteIsLater ? $remotePayload[$field] : $localPayload[$field];
                continue;
            }
            $mergedPayload[$field] = $localPayload[$field];
            $conflicts[] = [
                'field' => $field,
                'local' => $localPayload[$field],
                'remote' => $remotePayload[$field],
                'strategy' => 'manual_review',
            ];
        }

        return [
            'relation' => $relation,
            'state' => [
                'clock' => $localClock->merge($remoteClock)->toArray(),
                'updated_at' => $remoteIsLater ? ($remote['updated_at'] ?? null) : ($local['updated_at'] ?? null),
                'payload' => $mergedPayload,
            ],
            'conflicts' => $conflicts,
        ];
    }

    private function timestamp(mixed $value): int
    {
        if (!is_string($value)) {
            return 0;
        }
        $timestamp = strtotime($value);
        return $timestamp === false ? 0 : $timestamp;
    }
}

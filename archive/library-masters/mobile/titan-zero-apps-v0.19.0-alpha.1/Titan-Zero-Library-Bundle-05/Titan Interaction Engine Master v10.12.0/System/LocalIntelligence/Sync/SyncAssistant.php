<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\LocalIntelligence\Sync;

final class SyncAssistant
{
    public function buildPrivateDelta(array $localState, array $consent = []): array
    {
        $allowed = array_flip($consent['share'] ?? ['model_weights', 'aggregate_counts']);
        $delta = [
            'schema_version' => 1,
            'generated_at' => gmdate(DATE_ATOM),
            'device_hash' => isset($localState['device_id']) ? hash('sha256', (string) $localState['device_id']) : null,
        ];
        if (isset($allowed['model_weights'])) {
            $delta['model_weights'] = $localState['model_weights'] ?? [];
        }
        if (isset($allowed['aggregate_counts'])) {
            $delta['aggregate_counts'] = $localState['aggregate_counts'] ?? [];
        }
        return $delta;
    }

    public function merge(array $local, array $remote): array
    {
        $merged = $local;
        foreach (($remote['knowledge_delta'] ?? []) as $key => $value) {
            $merged['knowledge'][$key] = $value;
        }
        foreach (($remote['model_weights'] ?? []) as $key => $weight) {
            $localWeight = (float) ($merged['model_weights'][$key] ?? $weight);
            $merged['model_weights'][$key] = ($localWeight + (float) $weight) / 2;
        }
        $merged['last_sync_at'] = gmdate(DATE_ATOM);
        $merged['skill_versions'] = array_replace($merged['skill_versions'] ?? [], $remote['skill_versions'] ?? []);
        return $merged;
    }

    public function prune(array $events, int $maximum = 1000): array
    {
        usort($events, static fn(array $a, array $b): int => strcmp((string) ($b['timestamp'] ?? ''), (string) ($a['timestamp'] ?? '')));
        return array_slice($events, 0, max(0, $maximum));
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\LocalIntelligence\Temporal;

use App\Extensions\InteractionEngine\System\LocalIntelligence\Storage\LocalIntelligenceMemoryStoreInterface;
use App\Extensions\InteractionEngine\System\LocalIntelligence\Storage\NullLocalIntelligenceMemoryStore;

final class TemporalIntelligence
{
    private const MEMORY_TYPE = 'temporal_pattern';
    private const MAX_DURATION_SAMPLES = 200;

    private array $durations = [];
    private array $actionTimes = [];

    /** @var array<string, true> */
    private array $hydrated = [];

    /**
     * NOTE: $userId is accepted per-call (like BehavioralMemory), not
     * baked into the constructor — this class may be held by a
     * long-lived singleton (e.g. under Octane), and baking a specific
     * user's ID in at construction time would leak that user's temporal
     * data into other users' predictions on any worker that outlives a
     * single request.
     */
    public function __construct(
        private readonly LocalIntelligenceMemoryStoreInterface $store = new NullLocalIntelligenceMemoryStore(),
        private readonly string $companyId = 'local-standalone',
    ) {}

    public function record(string $action, \DateTimeInterface $time, ?float $durationMinutes = null, ?string $userId = null): void
    {
        $this->hydrate($action, $userId);

        $this->actionTimes[$action][] = ['weekday' => (int) $time->format('N'), 'hour' => (int) $time->format('G')];
        if ($durationMinutes !== null && $durationMinutes >= 0) {
            $this->durations[$action][] = $durationMinutes;
            if (count($this->durations[$action]) > self::MAX_DURATION_SAMPLES) {
                $this->durations[$action] = array_slice($this->durations[$action], -self::MAX_DURATION_SAMPLES);
            }
        }

        $this->store->put(
            $this->companyId,
            $userId,
            null,
            self::MEMORY_TYPE,
            $action,
            [
                'times' => $this->actionTimes[$action],
                'durations' => $this->durations[$action] ?? [],
            ],
        );
    }

    public function suggest(string $action, ?\DateTimeInterface $now = null, ?string $userId = null): array
    {
        $this->hydrate($action, $userId);
        $now ??= new \DateTimeImmutable();
        $samples = $this->actionTimes[$action] ?? [];
        if ($samples === []) {
            return ['action' => $action, 'confidence' => 0.25, 'recommended_hour' => null, 'weekday_match' => false];
        }
        $hours = array_count_values(array_column($samples, 'hour'));
        arsort($hours);
        $hour = (int) array_key_first($hours);
        $weekdayMatches = count(array_filter($samples, static fn (array $s): bool => $s['weekday'] === (int) $now->format('N')));
        return [
            'action' => $action,
            'confidence' => round(max($hours) / count($samples), 4),
            'recommended_hour' => $hour,
            'weekday_match' => $weekdayMatches > 0,
        ];
    }

    public function predictDuration(string $action, ?string $userId = null): array
    {
        $this->hydrate($action, $userId);
        $values = $this->durations[$action] ?? [];
        if ($values === []) {
            return ['estimated_minutes' => null, 'confidence' => 0.0, 'range' => null];
        }
        $average = array_sum($values) / count($values);
        $spread = max($values) - min($values);
        return [
            'estimated_minutes' => round($average, 1),
            'confidence' => round(1 / (1 + ($spread / max(1.0, $average))), 4),
            'range' => ['min' => min($values), 'max' => max($values)],
        ];
    }

    /**
     * Loads the persisted aggregate for this action into the in-memory
     * cache once per request/action, merging it ahead of any samples
     * recorded earlier in the same request. Without this, every method
     * here reset to zero knowledge on every new HTTP request — there was
     * no persistence layer wired in at all before this fix pass.
     */
    private function hydrate(string $action, ?string $userId): void
    {
        $hydrationKey = $action . '|' . ($userId ?? '');
        if (isset($this->hydrated[$hydrationKey])) {
            return;
        }
        $this->hydrated[$hydrationKey] = true;

        $stored = $this->store->get($this->companyId, $userId, null, self::MEMORY_TYPE, $action);
        if ($stored === null) {
            return;
        }

        $storedTimes = $stored['value']['times'] ?? [];
        $storedDurations = $stored['value']['durations'] ?? [];
        if (is_array($storedTimes)) {
            $this->actionTimes[$action] = array_merge($storedTimes, $this->actionTimes[$action] ?? []);
        }
        if (is_array($storedDurations)) {
            $this->durations[$action] = array_merge($storedDurations, $this->durations[$action] ?? []);
        }
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\LocalIntelligence\Memory;

use App\Extensions\InteractionEngine\System\LocalIntelligence\Storage\LocalIntelligenceMemoryStoreInterface;
use App\Extensions\InteractionEngine\System\LocalIntelligence\Storage\NullLocalIntelligenceMemoryStore;

final class BehavioralMemory
{
    private const MEMORY_TYPE = 'behavioral_transition';

    private array $actions = [];
    private array $lastAction = [];
    private array $transitions = [];

    /** @var array<string, true> tracks which (user, source-action) pairs have already been hydrated from storage this request */
    private array $hydrated = [];

    public function __construct(
        private readonly LocalIntelligenceMemoryStoreInterface $store = new NullLocalIntelligenceMemoryStore(),
        private readonly string $companyId = 'local-standalone',
    ) {}

    public function recordAction(int|string $userId, string $action, array $context): void
    {
        $key = (string) $userId;
        $previous = $this->lastAction[$key] ?? null;
        $this->actions[$key][] = [
            'action' => $action,
            'context' => $context,
            'timestamp' => gmdate(DATE_ATOM),
        ];
        if ($previous !== null) {
            $this->transitions[$key][$previous][$action] = ($this->transitions[$key][$previous][$action] ?? 0) + 1;

            // Write-through: the persistence that was missing entirely
            // before this fix pass. Storage's frequency counter (bumped
            // automatically by put() on every call) IS the transition
            // count, so the value payload only needs to be descriptive.
            $this->store->put(
                $this->companyId,
                $key,
                null,
                self::MEMORY_TYPE,
                $this->transitionKey($previous, $action),
                ['from' => $previous, 'to' => $action],
            );
        }
        $this->lastAction[$key] = $action;
    }

    public function predictNextAction(int|string $userId, ?string $after = null): array
    {
        $key = (string) $userId;
        $source = $after ?? ($this->lastAction[$key] ?? null);

        if ($source !== null) {
            $this->hydrate($key, $source);
        }

        $counts = $source === null ? [] : ($this->transitions[$key][$source] ?? []);
        if ($counts === []) {
            return ['action' => null, 'confidence' => 0.0, 'alternatives' => [], 'evidence' => []];
        }
        arsort($counts);
        $total = array_sum($counts);
        $action = (string) array_key_first($counts);
        return [
            'action' => $action,
            'confidence' => round($counts[$action] / max(1, $total), 4),
            'alternatives' => array_slice(array_keys($counts), 1, 3),
            'evidence' => ['transition_count' => $counts[$action], 'total_observations' => $total, 'after' => $source],
        ];
    }

    public function profile(int|string $userId): array
    {
        $key = (string) $userId;
        $frequency = [];
        foreach ($this->actions[$key] ?? [] as $event) {
            $frequency[$event['action']] = ($frequency[$event['action']] ?? 0) + 1;
        }
        arsort($frequency);
        return ['frequency' => $frequency, 'events' => count($this->actions[$key] ?? [])];
    }

    public function resetSequence(int|string $userId): void
    {
        unset($this->lastAction[(string) $userId]);
    }

    /**
     * Loads persisted transitions for this user/source-action into the
     * in-memory cache, once per request. Without this, predictNextAction()
     * would only ever see actions recorded earlier in the *same* request —
     * which, before this fix pass, was the only thing it could ever see,
     * since nothing persisted across requests at all.
     */
    private function hydrate(string $userKey, string $source): void
    {
        $hydrationKey = $userKey . '|' . $source;
        if (isset($this->hydrated[$hydrationKey])) {
            return;
        }
        $this->hydrated[$hydrationKey] = true;

        $rows = $this->store->all($this->companyId, $userKey, null, self::MEMORY_TYPE, $source . '->');
        foreach ($rows as $row) {
            $to = $row['value']['to'] ?? null;
            if (is_string($to) && $to !== '') {
                $this->transitions[$userKey][$source][$to] = $row['frequency'];
            }
        }
    }

    private function transitionKey(string $from, string $to): string
    {
        return $from . '->' . $to;
    }
}

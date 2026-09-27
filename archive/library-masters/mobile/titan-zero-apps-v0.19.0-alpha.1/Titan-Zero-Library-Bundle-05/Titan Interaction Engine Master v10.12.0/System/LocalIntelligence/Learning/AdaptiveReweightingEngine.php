<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\LocalIntelligence\Learning;

use App\Extensions\InteractionEngine\System\LocalIntelligence\Storage\LocalIntelligenceMemoryStoreInterface;
use App\Extensions\InteractionEngine\System\LocalIntelligence\Storage\NullLocalIntelligenceMemoryStore;

final class AdaptiveReweightingEngine
{
    private const MEMORY_TYPE = 'adaptive_weight';

    private array $weights = [];
    private array $history = [];

    /** @var array<string, true> */
    private array $hydratedUsers = [];

    // NOTE: $userId is per-call, not constructor-baked — see TemporalIntelligence's docblock for why.
    public function __construct(
        private readonly LocalIntelligenceMemoryStoreInterface $store = new NullLocalIntelligenceMemoryStore(),
        private readonly string $companyId = 'local-standalone',
    ) {}

    public function update(array $prediction, array $actual, float $learningRate = 0.1, ?string $userId = null): array
    {
        $this->hydrateAll($userId);

        foreach ($prediction as $feature => $predicted) {
            if (!is_numeric($predicted) || !isset($actual[$feature]) || !is_numeric($actual[$feature])) {
                continue;
            }
            $error = (float) $actual[$feature] - (float) $predicted;
            $current = (float) ($this->weights[$feature] ?? 1.0);
            $this->weights[$feature] = max(0.1, min(3.0, $current + ($learningRate * $error)));
            $this->history[] = ['feature' => $feature, 'error' => $error, 'weight' => $this->weights[$feature], 'timestamp' => gmdate(DATE_ATOM)];

            $this->store->put(
                $this->companyId,
                $userId,
                null,
                self::MEMORY_TYPE,
                (string) $feature,
                ['weight' => $this->weights[$feature]],
            );
        }
        if (count($this->history) > 1000) {
            $this->history = array_slice($this->history, -1000);
        }
        return $this->weights;
    }

    public function adjust(array $scores, ?string $userId = null): array
    {
        $this->hydrateAll($userId);

        $adjusted = [];
        foreach ($scores as $feature => $score) {
            $adjusted[$feature] = is_numeric($score) ? (float) $score * (float) ($this->weights[$feature] ?? 1.0) : $score;
        }
        return $adjusted;
    }

    public function weights(?string $userId = null): array
    {
        $this->hydrateAll($userId);
        return $this->weights;
    }

    /**
     * Loads every previously-learned weight for this user once per
     * request. Without this, weights reset to the 1.0 default (i.e. no
     * adjustment at all) on every new request — there was no persistence
     * layer wired in at all before this fix pass.
     */
    private function hydrateAll(?string $userId): void
    {
        $hydrationKey = $userId ?? '';
        if (isset($this->hydratedUsers[$hydrationKey])) {
            return;
        }
        $this->hydratedUsers[$hydrationKey] = true;

        $rows = $this->store->all($this->companyId, $userId, null, self::MEMORY_TYPE);
        foreach ($rows as $row) {
            $weight = $row['value']['weight'] ?? null;
            if (is_numeric($weight) && !array_key_exists($row['key'], $this->weights)) {
                $this->weights[$row['key']] = (float) $weight;
            }
        }
    }
}

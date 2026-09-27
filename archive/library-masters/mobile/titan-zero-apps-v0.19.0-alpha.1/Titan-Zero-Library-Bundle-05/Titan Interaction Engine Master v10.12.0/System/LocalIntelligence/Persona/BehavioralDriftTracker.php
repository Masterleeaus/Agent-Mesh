<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\LocalIntelligence\Persona;

use App\Extensions\InteractionEngine\System\LocalIntelligence\Storage\LocalIntelligenceMemoryStoreInterface;
use App\Extensions\InteractionEngine\System\LocalIntelligence\Storage\NullLocalIntelligenceMemoryStore;

final class BehavioralDriftTracker
{
    private const MEMORY_TYPE = 'persona_snapshot_v2';

    /** @var array<string, list<array<string, mixed>>> */
    private array $snapshots = [];

    /** @var array<string, true> */
    private array $hydrated = [];

    public function __construct(
        private readonly int $windowSize = 3,
        private readonly float $driftThreshold = 0.20,
        private readonly PersonaSignalAnalyzer $analyzer = new PersonaSignalAnalyzer(),
        private readonly KeywordTriggerExtractor $triggers = new KeywordTriggerExtractor(),
        private readonly LocalIntelligenceMemoryStoreInterface $store = new NullLocalIntelligenceMemoryStore(),
        private readonly string $companyId = 'local-standalone',
    ) {
        if ($windowSize < 2) {
            throw new \InvalidArgumentException('Behavioral drift window must contain at least two observations.');
        }
        if ($driftThreshold <= 0.0 || $driftThreshold > 1.0) {
            throw new \InvalidArgumentException('Behavioral drift threshold must be within (0, 1].');
        }
    }

    /** @return array<string, mixed> */
    public function observe(
        string|int $userId,
        string $text,
        ?\DateTimeInterface $observedAt = null,
        ?string $observationId = null,
        ?string $deviceId = null,
    ): array {
        $userKey = (string) $userId;
        $this->hydrate($userKey);
        $observedAt ??= new \DateTimeImmutable();
        $observationId ??= hash('sha256', $userKey . '|' . $observedAt->format(DATE_ATOM) . '|' . $text);
        $metrics = $this->analyzer->analyze($text);

        $history = $this->snapshots[$userKey] ?? [];
        $baselineSamples = array_slice($history, -$this->windowSize);
        $baseline = $this->baseline($baselineSamples);
        $sentimentDelta = $baseline === null ? 0.0 : abs($metrics['sentiment_polarity'] - $baseline['sentiment_polarity']);
        $formalityDelta = $baseline === null ? 0.0 : abs($metrics['formality'] - $baseline['formality']);
        $driftScore = max($sentimentDelta, $formalityDelta);
        $driftEvent = count($baselineSamples) >= $this->windowSize && $driftScore >= $this->driftThreshold;

        $snapshot = [
            'observation_id' => $observationId,
            'observed_at' => $observedAt->format(DATE_ATOM),
            'device_id' => $deviceId,
            'metrics' => $metrics,
            'baseline' => $baseline,
            'deltas' => [
                'sentiment' => round($sentimentDelta, 4),
                'formality' => round($formalityDelta, 4),
            ],
            'drift_score' => round($driftScore, 4),
            'drift_event' => $driftEvent,
            'triggers' => $driftEvent ? $this->triggers->extract($text) : [],
            'model' => 'adaptive-persona-v2',
        ];

        $this->snapshots[$userKey][] = $snapshot;
        if (count($this->snapshots[$userKey]) > 200) {
            $this->snapshots[$userKey] = array_slice($this->snapshots[$userKey], -200);
        }

        $this->store->put(
            $this->companyId,
            $userKey,
            null,
            self::MEMORY_TYPE,
            $observedAt->format('YmdHis.u') . ':' . $observationId,
            $snapshot,
            max(0.0, 1.0 - min(1.0, $driftScore)),
        );

        return $snapshot;
    }

    /** @return list<array<string, mixed>> */
    public function history(string|int $userId, int $limit = 20): array
    {
        $userKey = (string) $userId;
        $this->hydrate($userKey);
        return array_slice($this->snapshots[$userKey] ?? [], -max(0, $limit));
    }

    /** @param list<array<string, mixed>> $samples @return array{sentiment_polarity: float, formality: float}|null */
    private function baseline(array $samples): ?array
    {
        if ($samples === []) {
            return null;
        }
        $sentiment = 0.0;
        $formality = 0.0;
        foreach ($samples as $sample) {
            $sentiment += (float) ($sample['metrics']['sentiment_polarity'] ?? 0.0);
            $formality += (float) ($sample['metrics']['formality'] ?? 0.5);
        }
        return [
            'sentiment_polarity' => round($sentiment / count($samples), 4),
            'formality' => round($formality / count($samples), 4),
        ];
    }

    private function hydrate(string $userId): void
    {
        if (isset($this->hydrated[$userId])) {
            return;
        }
        $this->hydrated[$userId] = true;
        $this->snapshots[$userId] ??= [];
        $rows = $this->store->all($this->companyId, $userId, null, self::MEMORY_TYPE);
        foreach ($rows as $row) {
            $snapshot = $row['value'] ?? null;
            if (is_array($snapshot) && isset($snapshot['observed_at'], $snapshot['metrics'])) {
                $this->snapshots[$userId][] = $snapshot;
            }
        }
        usort($this->snapshots[$userId], static fn(array $left, array $right): int => strcmp((string) $left['observed_at'], (string) $right['observed_at']));
    }
}

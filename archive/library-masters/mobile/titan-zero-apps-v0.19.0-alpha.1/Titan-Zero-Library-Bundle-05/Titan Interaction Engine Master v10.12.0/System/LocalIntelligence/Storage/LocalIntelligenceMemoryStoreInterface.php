<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\LocalIntelligence\Storage;

/**
 * Generic persistence contract for the LocalIntelligence engines
 * (BehavioralMemory, TemporalIntelligence, PredictiveCompletionEngine,
 * AdaptiveReweightingEngine). Backs onto the local_intelligence_memories
 * table / LocalIntelligenceMemory model that existed in the source
 * archive but was never wired to anything — see CHANGELOG for details.
 */
interface LocalIntelligenceMemoryStoreInterface
{
    /**
     * @return array{value: array, confidence: float, frequency: int}|null
     */
    public function get(string $companyId, ?string $userId, ?string $deviceId, string $type, string $key): ?array;

    /**
     * @return list<array{key: string, value: array, confidence: float, frequency: int}>
     */
    public function all(string $companyId, ?string $userId, ?string $deviceId, string $type, ?string $keyPrefix = null): array;

    /**
     * Upsert: if the (tenant, user, device, type, key) tuple exists,
     * replaces its value, bumps frequency by 1, and updates
     * last_observed_at. If it doesn't exist, inserts it with frequency 1.
     */
    public function put(
        string $companyId,
        ?string $userId,
        ?string $deviceId,
        string $type,
        string $key,
        array $value,
        ?float $confidence = null
    ): void;
}

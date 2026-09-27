<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\LocalIntelligence\Storage;

final class NullLocalIntelligenceMemoryStore implements LocalIntelligenceMemoryStoreInterface
{
    public function get(string $companyId, ?string $userId, ?string $deviceId, string $type, string $key): ?array
    {
        return null;
    }

    public function all(string $companyId, ?string $userId, ?string $deviceId, string $type, ?string $keyPrefix = null): array
    {
        return [];
    }

    public function put(
        string $companyId,
        ?string $userId,
        ?string $deviceId,
        string $type,
        string $key,
        array $value,
        ?float $confidence = null
    ): void {
        // Intentional no-op.
    }
}

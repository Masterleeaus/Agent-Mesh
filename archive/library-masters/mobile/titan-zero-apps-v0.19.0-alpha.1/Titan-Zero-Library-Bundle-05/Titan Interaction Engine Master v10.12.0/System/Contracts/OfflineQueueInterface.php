<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Contracts;

interface OfflineQueueInterface
{
    public function queue(string $companyId, string $capability, array $payload, array $metadata = []): void;
    public function getPending(string $companyId): array;
    public function markSynced(string $companyId, int $id): void;
    public function markFailed(string $companyId, int $id, string $error): void;
    public function countPending(string $companyId): int;
    public function countByStatus(string $companyId, string $status): int;
    public function clear(string $companyId): void;
}

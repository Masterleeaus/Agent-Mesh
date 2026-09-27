<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Offline;

use App\Extensions\InteractionEngine\System\Contracts\OfflineQueueInterface;
use App\Extensions\InteractionEngine\System\Models\QueuedCommand;

final class OfflineQueue implements OfflineQueueInterface
{
    public function queue(string $companyId, string $capability, array $payload, array $metadata = []): void
    {
        $companyId = $this->requireCompanyId($companyId);
        QueuedCommand::create([
            'company_id' => $companyId,
            'capability' => $capability,
            'payload' => $payload,
            'metadata' => array_replace($metadata, ['company_id' => $companyId]),
            'status' => 'pending',
            'created_at' => now(),
            'attempts' => 0,
        ]);
    }

    public function getPending(string $companyId): array
    {
        $companyId = $this->requireCompanyId($companyId);
        return QueuedCommand::query()
            ->where('company_id', $companyId)
            ->where('status', 'pending')
            ->orderBy('created_at')
            ->limit(5000)->get()
            ->toArray();
    }

    public function markSynced(string $companyId, int $id): void
    {
        $companyId = $this->requireCompanyId($companyId);
        QueuedCommand::query()
            ->where('company_id', $companyId)
            ->where('id', $id)
            ->update(['status' => 'synced', 'synced_at' => now()]);
    }

    public function markFailed(string $companyId, int $id, string $error): void
    {
        $companyId = $this->requireCompanyId($companyId);
        QueuedCommand::query()
            ->where('company_id', $companyId)
            ->where('id', $id)
            ->update(['status' => 'failed', 'error' => $error, 'failed_at' => now()]);
    }

    public function countPending(string $companyId): int
    {
        return $this->countByStatus($companyId, 'pending');
    }

    public function countByStatus(string $companyId, string $status): int
    {
        if (!in_array($status, ['pending', 'synced', 'failed'], true)) {
            throw new \InvalidArgumentException('Unsupported queue status.');
        }

        $companyId = $this->requireCompanyId($companyId);
        return QueuedCommand::query()
            ->where('company_id', $companyId)
            ->where('status', $status)
            ->count();
    }

    public function clear(string $companyId): void
    {
        $companyId = $this->requireCompanyId($companyId);
        QueuedCommand::query()
            ->where('company_id', $companyId)
            ->whereIn('status', ['synced', 'failed'])
            ->delete();
    }

    private function requireCompanyId(string $companyId): string
    {
        $companyId = trim($companyId);
        if ($companyId === '') {
            throw new \InvalidArgumentException('Offline queue operations require company_id.');
        }
        return $companyId;
    }
}

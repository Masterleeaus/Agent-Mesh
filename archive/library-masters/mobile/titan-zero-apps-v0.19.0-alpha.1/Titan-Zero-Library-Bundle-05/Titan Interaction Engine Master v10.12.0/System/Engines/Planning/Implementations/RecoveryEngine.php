<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Planning\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Planning\Contracts\RecoveryEngineInterface;

class RecoveryEngine implements RecoveryEngineInterface
{
    private array $failures = [];

    public function recover(string $failureId): bool
    {
        if (!isset($this->failures[$failureId])) {
            return false;
        }
        $this->failures[$failureId]['status'] = 'recovered';
        $this->failures[$failureId]['recovered_at'] = gmdate(DATE_ATOM);
        return true;
    }

    public function getFailureLog(): array
    {
        return array_values($this->failures);
    }

    public function retry(string $taskId): bool
    {
        foreach ($this->failures as &$failure) {
            if (($failure['task_id'] ?? null) === $taskId && ($failure['status'] ?? '') !== 'recovered') {
                $failure['attempts'] = ($failure['attempts'] ?? 0) + 1;
                $failure['last_retry_at'] = gmdate(DATE_ATOM);
                return true;
            }
        }
        unset($failure);
        return false;
    }

    public function recordFailure(string $failureId, string $taskId, string $message): void
    {
        $this->failures[$failureId] = [
            'id' => $failureId,
            'task_id' => $taskId,
            'message' => $message,
            'status' => 'open',
            'attempts' => 0,
            'created_at' => gmdate(DATE_ATOM),
        ];
    }
}

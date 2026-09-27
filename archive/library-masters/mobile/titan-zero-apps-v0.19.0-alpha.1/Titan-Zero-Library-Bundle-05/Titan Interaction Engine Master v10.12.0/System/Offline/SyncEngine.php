<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Offline;

use App\Extensions\InteractionEngine\System\Contracts\OfflineQueueInterface;
use App\Extensions\InteractionEngine\System\Contracts\CommandBusInterface;
use App\Extensions\InteractionEngine\System\Contracts\EventRecorderInterface;
use App\Extensions\InteractionEngine\System\Contracts\ConflictResolverInterface;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;
use App\Extensions\InteractionEngine\System\Wizard\Offline\LocalCommandOutbox;
use Illuminate\Support\Facades\Log;
use App\Extensions\InteractionEngine\System\Settings\SettingsResolver;

final class SyncEngine
{
    public function __construct(
        private readonly OfflineQueueInterface $queue,
        private readonly CommandBusInterface $commandBus,
        private readonly EventRecorderInterface $eventRecorder,
        private readonly ConflictResolverInterface $conflictResolver,
        private readonly CompanyExecutionContext $companyContext,
        private readonly ?LocalCommandOutbox $wizardOutbox = null,
        private readonly ?SettingsResolver $settings = null,
    ) {
    }

    public function sync(string $companyId): array
    {
        $companyId = trim($companyId);
        if ($companyId === '') {
            throw new \InvalidArgumentException('Sync requires an explicit company_id.');
        }
        $this->companyContext->restore($companyId);

        $results = ['synced' => 0, 'failed' => 0, 'conflicts' => 0, 'wizard_synced' => 0, 'wizard_deferred' => 0, 'wizard_failed' => 0];
        $defaultBatchSize = function_exists('config') ? (int) config('interaction-engine.offline.sync_batch_size', 100) : 100;
        $batchSize = $this->settings?->platformInt('sync_batch_size', $defaultBatchSize) ?? $defaultBatchSize;
        $pending = array_slice($this->queue->getPending($companyId), 0, max(1, $batchSize));
        if ($pending === [] && $this->wizardOutbox === null) {
            return $results;
        }

        $this->log('info', 'Starting interaction-engine sync', ['company_id' => $companyId, 'count' => count($pending)]);

        foreach ($pending as $command) {
            $commandId = (int) ($command['id'] ?? 0);
            if (($command['company_id'] ?? null) !== $companyId) {
                $this->log('error', 'Rejected cross-company queued command', ['company_id' => $companyId, 'command_id' => $commandId]);
                $results['failed']++;
                continue;
            }

            try {
                $conflict = $this->conflictResolver->resolve($command);
                if ($conflict['conflict']) {
                    $this->queue->markFailed($companyId, $commandId, 'Conflict: ' . $conflict['message']);
                    $results['conflicts']++;
                    continue;
                }

                $payload = (array) ($command['payload'] ?? []);
                $offlineIdempotencyKey = 'interaction-offline:'.hash('sha256', $companyId.'|'.$commandId.'|'.(string) $command['capability']);
                $payload['_context'] = array_replace((array) ($payload['_context'] ?? []), [
                    'company_id' => $companyId,
                    'idempotency_key' => $offlineIdempotencyKey,
                    'offline_replay' => true,
                ]);
                $payload['company_id'] = $companyId;
                $payload['idempotency_key'] = $offlineIdempotencyKey;

                $this->commandBus->dispatch((string) $command['capability'], $payload);
                $this->queue->markSynced($companyId, $commandId);
                $results['synced']++;

                $this->eventRecorder->record('command_synced', [
                    'command_id' => $commandId,
                    'capability' => (string) $command['capability'],
                    'company_id' => $companyId,
                ]);
            } catch (\Throwable $e) {
                $this->log('error', 'Interaction-engine sync failed', [
                    'company_id' => $companyId,
                    'command_id' => $commandId,
                    'error_class' => $e::class,
                ]);
                $this->queue->markFailed($companyId, $commandId, $e->getMessage());
                $results['failed']++;
            }
        }

        if ($this->wizardOutbox instanceof LocalCommandOutbox) {
            foreach ($this->wizardOutbox->pending($companyId) as $envelope) {
                try {
                    $command = $this->wizardOutbox->decrypt($envelope);
                    $metadataCompany = (string) ($command['metadata']['company_id'] ?? '');
                    $payloadCompany = (string) ($command['payload']['_context']['company_id'] ?? '');
                    if ($metadataCompany !== $companyId || ($payloadCompany !== '' && $payloadCompany !== $companyId)) {
                        throw new \RuntimeException('Encrypted wizard command company_id does not match active company.');
                    }
                    $capability = (string) ($command['capability'] ?? '');
                    if ($capability === '' || !$this->commandBus->hasHandler($capability)) {
                        $results['wizard_deferred']++;
                        continue;
                    }
                    $payload = (array) ($command['payload'] ?? []);
                    $wizardCommandId = (string) ($envelope['id'] ?? '');
                    $wizardIdempotencyKey = 'interaction-wizard:'.hash('sha256', $companyId.'|'.$wizardCommandId.'|'.$capability);
                    $payload['_context'] = array_replace((array) ($payload['_context'] ?? []), [
                        'company_id' => $companyId,
                        'idempotency_key' => $wizardIdempotencyKey,
                        'offline_replay' => true,
                    ]);
                    $payload['company_id'] = $companyId;
                    $payload['idempotency_key'] = $wizardIdempotencyKey;
                    $this->commandBus->dispatch($capability, $payload);
                    $this->wizardOutbox->markSynced((string) ($envelope['id'] ?? ''), $companyId);
                    $results['wizard_synced']++;
                    $this->eventRecorder->record('wizard_command_synced', [
                        'command_id' => (string) ($envelope['id'] ?? ''),
                        'capability' => $capability,
                        'company_id' => $companyId,
                    ]);
                } catch (\Throwable $e) {
                    $results['wizard_failed']++;
                    $this->log('error', 'Encrypted wizard outbox sync failed', [
                        'company_id' => $companyId,
                        'command_id' => (string) ($envelope['id'] ?? ''),
                        'error_class' => $e::class,
                    ]);
                }
            }
        }

        $this->log('info', 'Interaction-engine sync completed', ['company_id' => $companyId] + $results);
        return $results;
    }

    private function log(string $level, string $message, array $context = []): void
    {
        if (class_exists(Log::class) && method_exists(Log::class, $level)) {
            Log::{$level}($message, $context);
        }
    }

    public function getStatus(string $companyId): array
    {
        $pending = $this->queue->countPending($companyId);
        $synced = $this->queue->countByStatus($companyId, 'synced');
        $failed = $this->queue->countByStatus($companyId, 'failed');

        $wizardPending = $this->wizardOutbox instanceof LocalCommandOutbox ? count($this->wizardOutbox->pending($companyId)) : 0;
        return ['pending' => $pending, 'synced' => $synced, 'failed' => $failed, 'wizard_pending' => $wizardPending, 'total' => $pending + $synced + $failed + $wizardPending];
    }
}

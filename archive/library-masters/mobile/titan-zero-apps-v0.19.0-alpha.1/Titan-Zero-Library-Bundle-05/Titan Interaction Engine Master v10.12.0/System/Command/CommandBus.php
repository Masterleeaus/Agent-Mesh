<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Command;

use App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEvent;
use App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEventStoreInterface;
use App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEventType;
use App\Extensions\InteractionEngine\System\Contracts\CommandBusInterface;
use App\Extensions\InteractionEngine\System\Contracts\EventRecorderInterface;
use App\Extensions\InteractionEngine\System\Contracts\PolicyEngineInterface;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;
use App\Extensions\InteractionEngine\System\Lifecycle\ExtensionState;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityResult;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityRouter;

final class CommandBus implements CommandBusInterface
{
    private array $handlers = [];

    public function __construct(
        private readonly PolicyEngineInterface $policyEngine,
        private readonly EventRecorderInterface $eventRecorder,
        private readonly ExtensionState $extensionState,
        private readonly ?CognitiveEventStoreInterface $cognitiveEvents = null,
        private readonly ?CompanyExecutionContext $tenantContext = null,
        private readonly ?CapabilityRouter $capabilityRouter = null,
    ) {
    }

    public function registerHandler(string $capability, callable $handler): void
    {
        $this->handlers[$capability] = $handler;
    }

    public function hasHandler(string $capability): bool
    {
        return isset($this->handlers[$capability]) || $this->capabilityRouter?->descriptor($capability) !== null;
    }

    public function dispatch(string $capability, array $payload): void
    {
        $result = $this->dispatchResult($capability, $payload);
        if (!in_array($result->status, ['executed', 'prepared', 'offline_deferred'], true)) {
            throw new \RuntimeException($result->reason ?? "Capability '{$result->capability}' returned {$result->status}.");
        }
    }

    public function dispatchResult(string $capability, array $payload): CapabilityResult
    {
        if (!$this->extensionState->enabled()) {
            throw new \RuntimeException('Interaction Engine is disabled.');
        }

        $requestedCapability = $capability;
        if (!$this->hasHandler($requestedCapability)) {
            return CapabilityResult::unavailable($requestedCapability, 'none', "No provider or local handler is registered for capability '{$requestedCapability}'.");
        }

        // Legacy capability aliases are migration-only names. Canonicalize before
        // authority evaluation so aliases cannot create a second policy namespace
        // or bypass/lose the authority attached to the owning provider capability.
        $capability = $this->capabilityRouter?->canonical($requestedCapability) ?? $requestedCapability;

        $context = (array) ($payload['_context'] ?? []);
        $companyId = trim((string) ($context['company_id'] ?? ''));
        if ($companyId === '') {
            throw new \RuntimeException('Trusted company_id context is required before a command can be dispatched.');
        }
        if (isset($context['company_id']) && (string) $context['company_id'] !== $companyId) {
            throw new \RuntimeException('company_id does not match command company_id.');
        }
        if ($this->tenantContext !== null && $this->tenantContext->companyId() !== $companyId) {
            throw new \RuntimeException('Command company_id does not match the trusted company execution context.');
        }

        $correlationId = (string) ($payload['correlation_id'] ?? $context['correlation_id'] ?? '');
        $metadata = $this->commandMetadata($payload, $correlationId);
        if ($requestedCapability !== $capability) {
            $metadata['requested_capability'] = $requestedCapability;
        }
        $this->recordCognitive(CognitiveEventType::CommandPrepared, $companyId, $capability, $metadata, $correlationId, $payload);

        $decision = $this->policyEngine->decide($capability, $payload);
        if (!$decision->allowed) {
            $reasons = $decision->reasons;
            if ($decision->authority === \App\Extensions\InteractionEngine\System\Authority\AuthorityLevel::PrepareOnly) {
                $prepared = CapabilityResult::prepared(
                    $capability,
                    $this->capabilityRouter?->descriptor($capability)?->provider ?? 'interaction',
                    ['command' => $metadata, 'reason' => implode('; ', $reasons)]
                );
                $this->eventRecorder->record('capability_prepared', [
                    'capability' => $capability,
                    'command' => $metadata,
                ]);
                $this->recordCognitive(CognitiveEventType::CommandPrepared, $companyId, $capability, ['command' => $metadata, 'prepared_only' => true], $correlationId, $payload);
                return $prepared;
            }
            $this->eventRecorder->record('capability_denied', [
                'capability' => $capability,
                'reasons' => $reasons,
                'command' => $metadata,
            ]);
            $this->recordCognitive(
                CognitiveEventType::ConstraintRejected,
                $companyId,
                $capability,
                ['reasons' => $reasons, 'authority' => $decision->authority->value, 'requires_human' => $decision->requiresHuman, 'requires_approval' => $decision->requiresApproval, 'command' => $metadata],
                $correlationId,
                $payload,
            );
            return CapabilityResult::unauthorized($capability, $this->capabilityRouter?->descriptor($capability)?->provider ?? 'interaction', 'Policy denied: ' . implode('; ', $reasons));
        }

        // Cost sovereignty is evaluated after authority/policy and before any provider side effect.
        $resourceEconomics = $payload['_resource_economics'] ?? null;
        if (is_array($resourceEconomics)) {
            if (! app()->bound('titan.workforce.cost-sovereignty')) {
                return CapabilityResult::failed($capability, $this->capabilityRouter?->descriptor($capability)?->provider ?? 'interaction', 'COST_SOVEREIGNTY_ROUTER_UNAVAILABLE');
            }
            $route = app('titan.workforce.cost-sovereignty')->select(
                (int) $companyId,
                (string) ($resourceEconomics['resource_type'] ?? 'external_api'),
                (array) ($resourceEconomics['candidates'] ?? []),
                [
                    'business_capability_tier' => $context['business_capability_tier'] ?? 'free',
                    'autonomy_level' => $context['autonomy_level'] ?? 'assist',
                    'explicit_titan_opt_in' => (bool) ($resourceEconomics['explicit_titan_managed_opt_in'] ?? false),
                    'explicit_cost_approval' => (bool) ($resourceEconomics['explicit_cost_approval'] ?? false),
                    'estimated_cost' => (float) ($resourceEconomics['estimated_cost'] ?? 0.0),
                    'privacy_classification' => $resourceEconomics['privacy_classification'] ?? 'private_preferred',
                ],
            );
            if (($route['status'] ?? null) !== 'selected' || ! is_array($route['selected'] ?? null)) {
                return CapabilityResult::failed($capability, $this->capabilityRouter?->descriptor($capability)?->provider ?? 'interaction', (string) ($route['reason'] ?? 'RESOURCE_COST_ROUTE_DENIED'));
            }
            $payload['_resource_economics']['selected_route'] = $route['selected'];
        }

        try {
            if (isset($this->handlers[$capability])) {
                $rawResult = ($this->handlers[$capability])($payload);
                $executionResult = CapabilityResult::executed($capability, 'interaction', $rawResult);
            } elseif ($this->capabilityRouter !== null) {
                $executionContext = CapabilityExecutionContext::fromPayload($payload);
                $executionResult = $this->capabilityRouter->execute($capability, $payload, $executionContext);
            } else {
                $executionResult = CapabilityResult::unavailable($capability, 'none', 'Capability router is unavailable.');
            }

            $resultSummary = $this->resultMetadata($executionResult->toArray());
            $success = in_array($executionResult->status, ['executed', 'prepared', 'offline_deferred'], true);
            $this->eventRecorder->record('capability_executed', [
                'capability' => $executionResult->capability,
                'provider' => $executionResult->provider,
                'status' => $executionResult->status,
                'command' => $metadata,
                'result' => $resultSummary,
                'success' => $success,
            ]);
            $this->recordCognitive($success ? CognitiveEventType::CommandExecuted : CognitiveEventType::CommandFailed, $companyId, $executionResult->capability, ['provider' => $executionResult->provider, 'status' => $executionResult->status, 'command' => $metadata, 'result' => $resultSummary, 'success' => $success], $correlationId, $payload);
            return $executionResult;
        } catch (\Throwable $e) {
            $this->eventRecorder->record('capability_executed', [
                'capability' => $capability,
                'command' => $metadata,
                'error_class' => $e::class,
                'success' => false,
            ]);
            $this->recordCognitive(CognitiveEventType::CommandFailed, $companyId, $capability, ['command' => $metadata, 'error_class' => $e::class, 'success' => false], $correlationId, $payload);
            return CapabilityResult::failed($capability, $this->capabilityRouter?->descriptor($capability)?->provider ?? 'interaction', $e->getMessage());
        }
    }

    private function commandMetadata(array $payload, string $correlationId): array
    {
        $context = (array) ($payload['_context'] ?? []);
        $keys = array_values(array_filter(array_keys($payload), static fn (string|int $key): bool => (string) $key !== '_context'));
        sort($keys);

        return [
            'correlation_id' => $correlationId !== '' ? $correlationId : null,
            'payload_keys' => $keys,
            'payload_hash' => hash('sha256', json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR) ?: ''),
            'subject_type' => $context['subject_type'] ?? null,
            'subject_id' => $context['subject_id'] ?? null,
            'wizard_run_id' => $context['wizard_run_id'] ?? null,
        ];
    }

    private function resultMetadata(mixed $result): array
    {
        $encoded = json_encode($result, JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR);
        return [
            'type' => get_debug_type($result),
            'hash' => hash('sha256', $encoded === false ? '' : $encoded),
        ];
    }

    private function recordCognitive(
        CognitiveEventType $type,
        string $companyId,
        string $capability,
        array $details,
        string $correlationId,
        array $sourcePayload,
    ): void {
        if ($this->cognitiveEvents === null) {
            return;
        }
        $context = (array) ($sourcePayload['_context'] ?? []);
        $event = CognitiveEvent::create(
            type: $type,
            companyId: $companyId,
            payload: ['capability' => $capability, 'details' => $details],
            userId: isset($context['user_id']) ? (string) $context['user_id'] : null,
            deviceId: isset($context['device_id']) ? (string) $context['device_id'] : null,
            teamId: isset($context['team_id']) ? (string) $context['team_id'] : null,
            subjectType: isset($context['subject_type']) ? (string) $context['subject_type'] : null,
            subjectId: isset($context['subject_id']) ? (string) $context['subject_id'] : null,
            wizardRunId: isset($context['wizard_run_id']) ? (string) $context['wizard_run_id'] : null,
            correlationId: $correlationId !== '' ? $correlationId : null,
            privacyClass: (string) ($context['privacy_class'] ?? 'company_private'),
        );
        $this->cognitiveEvents->append($event);
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard;

use App\Extensions\InteractionEngine\System\Contracts\CommandBusInterface;
use App\Extensions\InteractionEngine\System\Wizard\Command\CommandMapper;
use App\Extensions\InteractionEngine\System\Wizard\Guidance\LocalGuidanceProvider;
use App\Extensions\InteractionEngine\System\Wizard\Governance\GovernanceViolation;
use App\Extensions\InteractionEngine\System\Wizard\Governance\GovernedCompletionPolicy;
use App\Extensions\InteractionEngine\System\Wizard\Offline\LocalCommandOutbox;
use App\Extensions\InteractionEngine\System\Wizard\Validation\WizardValidationEngine;
use App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEvent;
use App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEventStoreInterface;
use App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEventType;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext;
use App\Extensions\InteractionEngine\System\Registry\CapabilityRegistry;
use App\Extensions\InteractionEngine\System\Command\CommandBus;

final class UniversalWizardEngine
{
    public function __construct(
        private readonly WizardRegistry $registry,
        private readonly WizardValidationEngine $validator,
        private readonly LocalGuidanceProvider $guidance,
        private readonly CommandMapper $commandMapper,
        private readonly LocalCommandOutbox $outbox,
        private readonly ?CommandBusInterface $commandBus = null,
        private readonly ?CognitiveEventStoreInterface $cognitiveEvents = null,
        private readonly ?GovernedCompletionPolicy $completionPolicy = null,
        private readonly ?CapabilityRegistry $capabilities = null,
    ) {}

    public function start(string $wizardId, array $context = []): WizardSession
    {
        $session = new WizardSession(
            id: bin2hex(random_bytes(16)),
            definition: $this->registry->get($wizardId),
            context: $context,
        );
        $this->record(CognitiveEventType::ObservationRecorded, $session, ['wizard_started' => $wizardId]);
        return $session;
    }

    public function submitStep(WizardSession $session, array $input): WizardResult
    {
        if ($session->complete()) {
            return new WizardResult($session, true, guidance: 'This wizard is already complete.');
        }
        $step = $session->currentStep();
        if ($step === null) {
            throw new \LogicException('Wizard session points to a missing step.');
        }
        $errors = $this->validator->validateStep($step, $input, $session->data);
        if ($errors !== []) {
            return new WizardResult($session, errors: $errors, guidance: $this->guidance->guidance($step, $session->data, $errors));
        }
        // Persist only fields declared by the current wizard step. This prevents
        // undeclared client data (including raw credentials) from entering session
        // history, plan compilation or audit/cognitive payloads.
        $input = $this->validator->filterStepInput($step, $input, $session->data);

        $snapshot = [
            'data' => $session->data,
            'history' => $session->history,
            'step_index' => $session->stepIndex,
            'status' => $session->status,
        ];

        $session->data = array_replace($session->data, $input);
        $session->history[] = [
            'step_id' => $step['id'],
            'input' => $input,
            'completed_at' => gmdate(DATE_ATOM),
        ];
        $session->stepIndex++;
        $this->skipConditionalSteps($session);

        if ($session->stepIndex >= $session->definition->stepCount()) {
            try {
                ($this->completionPolicy ?? new GovernedCompletionPolicy())->assertMayComplete(
                    $session->definition,
                    $session->data,
                    $session->context,
                );
            } catch (GovernanceViolation $violation) {
                $session->data = $snapshot['data'];
                $session->history = $snapshot['history'];
                $session->stepIndex = $snapshot['step_index'];
                $session->status = $snapshot['status'];
                return new WizardResult(
                    $session,
                    errors: ['_governance' => $violation->violations],
                    guidance: 'This workflow cannot complete until its governance requirements are satisfied.',
                );
            }

            $session->status = 'completed';
            $command = $this->commandMapper->map($session);
            $metadata = (array) ($command['metadata'] ?? []);
            $context = $session->context;
            $command['payload']['_context'] = array_replace((array) ($command['payload']['_context'] ?? []), [
                'company_id' => (string) ($context['company_id'] ?? ''),
                'company_id' => (string) ($context['company_id'] ?? ''), // compatibility alias only
                'user_id' => $context['user_id'] ?? null,
                'device_id' => (string) ($context['device_id'] ?? ''),
                'team_id' => $context['team_id'] ?? null,
                'actor_type' => (string) ($context['actor_type'] ?? 'unknown'),
                'roles' => array_values((array) ($context['roles'] ?? [])),
                'delegated_scopes' => array_values((array) ($context['delegated_scopes'] ?? [])),
                'authenticated_at' => $context['authenticated_at'] ?? null,
                'wizard_run_id' => $session->id,
                'correlation_id' => (string) ($metadata['correlation_id'] ?? $context['correlation_id'] ?? $session->id),
                'causation_id' => (string) ($metadata['causation_id'] ?? $context['causation_id'] ?? $context['correlation_id'] ?? $session->id),
                'idempotency_key' => (string) ($metadata['idempotency_key'] ?? ''),
                'template_id' => (string) ($metadata['template_id'] ?? $session->definition->id),
                'template_version' => (string) ($metadata['template_version'] ?? $session->definition->version),
                'privacy_class' => (string) ($context['privacy_class'] ?? 'company_private'),
            ]);
            $this->record(CognitiveEventType::CommandPrepared, $session, ['command' => $command]);
            $capability = (string) $command['capability'];
            $payload = (array) $command['payload'];
            $executionContext = null;
            try { $executionContext = CapabilityExecutionContext::fromPayload($payload); } catch (\Throwable) {}
            $status = $this->capabilities?->status($capability, $executionContext) ?? ['available' => $this->commandBus?->hasHandler($capability) ?? false];
            if ($this->commandBus !== null && ($status['available'] ?? false)) {
                if ($this->commandBus instanceof CommandBus) {
                    $outcome = $this->commandBus->dispatchResult($capability, $payload);
                    if (in_array($outcome->status, ['executed','prepared'], true)) {
                        return new WizardResult($session, true, command: $command, guidance: 'Executed through the company-scoped governed capability boundary.');
                    }
                    if ($outcome->status !== 'offline_deferred') {
                        $session->status = 'awaiting_provider';
                        return new WizardResult($session, false, errors: ['_capability' => [$outcome->reason ?? $outcome->status]], guidance: 'The owning Titan subsystem could not complete this action. Your wizard state is preserved.', command: $command);
                    }
                } else {
                    $this->commandBus->dispatch($capability, $payload);
                    return new WizardResult($session, true, command: $command, guidance: 'Executed through the company-scoped governed capability boundary.');
                }
            }
            $offlineMode = (string) (($status['descriptor']['offline'] ?? null) ?: ($session->definition->offline['mode'] ?? (($session->definition->offline['enabled'] ?? false) ? 'offline_queueable' : 'online_required')));
            if ($offlineMode === 'offline_queueable') {
                $this->outbox->enqueue($command);
                $session->status = 'offline_deferred';
                return new WizardResult($session, true, command: $command, guidance: 'The owning capability is unavailable now; this company-scoped action was queued for safe replay.');
            }
            $session->status = 'awaiting_online';
            return new WizardResult($session, false, errors: ['_capability' => ['This action requires an online owning provider.']], guidance: 'Answers are preserved. Reconnect and resume this interaction to execute the online-required capability.', command: $command);
        }

        $next = $session->currentStep() ?? [];
        return new WizardResult($session, guidance: $this->guidance->guidance($next, $session->data));
    }

    private function skipConditionalSteps(WizardSession $session): void
    {
        while (($step = $session->currentStep()) !== null && isset($step['when']) && !$this->matches((array) $step['when'], $session->data)) {
            $session->history[] = ['step_id' => $step['id'], 'skipped' => true, 'completed_at' => gmdate(DATE_ATOM)];
            $session->stepIndex++;
        }
    }

    private function matches(array $conditions, array $data): bool
    {
        foreach ($conditions as $key => $expected) {
            if (($data[$key] ?? null) !== $expected) {
                return false;
            }
        }
        return true;
    }

    private function record(CognitiveEventType $type, WizardSession $session, array $payload): void
    {
        if ($this->cognitiveEvents === null) {
            return;
        }
        $companyId = trim((string) ($session->context['company_id'] ?? ''));
        if ($companyId === '') {
            throw new \RuntimeException('Wizard execution requires trusted company company context.');
        }
        $event = CognitiveEvent::create(
            type: $type,
            companyId: $companyId,
            payload: $payload,
            userId: isset($session->context['user_id']) ? (string) $session->context['user_id'] : null,
            deviceId: isset($session->context['device_id']) ? (string) $session->context['device_id'] : null,
            teamId: isset($session->context['team_id']) ? (string) $session->context['team_id'] : null,
            wizardRunId: $session->id,
            correlationId: (string) ($session->context['correlation_id'] ?? $session->id),
            privacyClass: (string) ($session->context['privacy_class'] ?? 'company_private'),
            sequence: count($session->history),
        );
        $this->cognitiveEvents->append($event);
    }
}

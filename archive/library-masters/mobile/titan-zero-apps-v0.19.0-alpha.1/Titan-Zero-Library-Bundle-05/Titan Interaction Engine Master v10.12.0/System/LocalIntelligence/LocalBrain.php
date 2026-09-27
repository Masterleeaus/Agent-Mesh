<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\LocalIntelligence;

use App\Extensions\InteractionEngine\System\LocalIntelligence\Decision\DecisionTreeEngine;
use App\Extensions\InteractionEngine\System\LocalIntelligence\Language\LocalLanguageEngine;
use App\Extensions\InteractionEngine\System\LocalIntelligence\Memory\BehavioralMemory;
use App\Extensions\InteractionEngine\System\LocalIntelligence\Prediction\PredictiveCompletionEngine;
use App\Extensions\InteractionEngine\System\LocalIntelligence\Reasoning\HybridReasoner;
use App\Extensions\InteractionEngine\System\LocalIntelligence\Reasoning\WeightedMemoryReranker;
use App\Extensions\InteractionEngine\System\LocalIntelligence\Persona\BehavioralDriftTracker;
use App\Extensions\InteractionEngine\System\LocalIntelligence\Storage\LocalIntelligenceMemoryStoreInterface;
use App\Extensions\InteractionEngine\System\LocalIntelligence\Temporal\TemporalIntelligence;
use App\Extensions\InteractionEngine\System\Cognition\Decision\DecisionRecorder;
use App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEventStoreInterface;
use App\Extensions\InteractionEngine\System\Cognition\Events\InMemoryCognitiveEventStore;

final class LocalBrain
{
    public const MODEL_VERSION = 'local-brain-v2';

    public function __construct(
        private readonly LocalLanguageEngine $language,
        private readonly DecisionTreeEngine $decisionTree,
        private readonly BehavioralMemory $memory,
        private readonly HybridReasoner $reasoner,
        private readonly TemporalIntelligence $temporal,
        private readonly PredictiveCompletionEngine $completion,
        private readonly ?DecisionRecorder $decisionRecorder = null,
        private readonly BehavioralDriftTracker $persona = new BehavioralDriftTracker(),
        private readonly WeightedMemoryReranker $memoryReranker = new WeightedMemoryReranker(),
        private readonly ?string $companyId = null,
    ) {}

    public static function createDefault(): self
    {
        $reasoner = self::defaultReasoner();
        return new self(
            new LocalLanguageEngine(),
            new DecisionTreeEngine(),
            new BehavioralMemory(),
            $reasoner,
            new TemporalIntelligence(),
            new PredictiveCompletionEngine(),
            new DecisionRecorder(new InMemoryCognitiveEventStore()),
            new BehavioralDriftTracker(),
            new WeightedMemoryReranker(),
        );
    }

    /**
     * Real, persistence-backed construction used by the service provider.
     * createDefault() remains dependency-free for the standalone test harness.
     */
    public static function createWithPersistence(
        LocalIntelligenceMemoryStoreInterface $store,
        string $companyId,
        ?CognitiveEventStoreInterface $cognitiveEvents = null,
    ): self {
        return new self(
            new LocalLanguageEngine(),
            new DecisionTreeEngine(),
            new BehavioralMemory($store, $companyId),
            self::defaultReasoner(),
            new TemporalIntelligence($store, $companyId),
            new PredictiveCompletionEngine($store, $companyId),
            $cognitiveEvents === null ? null : new DecisionRecorder($cognitiveEvents),
            new BehavioralDriftTracker(store: $store, companyId: $companyId),
            new WeightedMemoryReranker(),
            companyId: $companyId,
        );
    }

    private static function defaultReasoner(): HybridReasoner
    {
        $reasoner = new HybridReasoner();
        $reasoner->addRule('required_customer_for_transaction', static function (array $candidate, array $context): bool {
            $action = $candidate['action'] ?? '';
            if (!in_array($action, ['create_quote', 'schedule_job', 'create_invoice'], true)) {
                return true;
            }
            return !empty($context['entities']['customer']) || !empty($context['customer_id']);
        });
        return $reasoner;
    }

    public function process(string $input, array $context = []): array
    {
        $perception = $this->language->understand($input);
        $intent = $perception['intent'];
        $operationalIntents = ['schedule_job', 'create_quote', 'create_invoice', 'record_payment', 'create_customer', 'complete_job', 'report_damage'];
        $candidate = ['action' => in_array($intent, $operationalIntents, true) ? $intent : null, 'confidence' => $perception['confidence']];
        $reasoningContext = array_replace($context, ['entities' => $perception['entities']]);
        $decision = $this->reasoner->reason([$candidate], $reasoningContext);
        $userId = $context['user_id'] ?? 'anonymous';
        $prediction = $this->memory->predictNextAction($userId, $decision['action']);
        $suggestions = [];
        if (!in_array($intent, $operationalIntents, true)) {
            $suggestions[] = 'Intent classified locally; no remote capability command was prepared.';
        } elseif ($decision['needs_clarification']) {
            $suggestions[] = 'Provide the missing customer or job details before execution.';
        } else {
            $suggestions[] = 'Open the matching wizard with extracted fields prefilled.';
        }
        if ($prediction['action'] !== null) {
            $suggestions[] = 'Likely next action: ' . $prediction['action'];
        }
        $companyId = $this->resolveCompanyContext($context);
        if ($decision['action'] !== null && $this->decisionRecorder !== null) {
            $this->decisionRecorder->recordRecommendation(
                companyId: $companyId,
                proposedAction: (string) $decision['action'],
                confidence: (float) $decision['confidence'],
                scope: [
                    'user_id' => (string) $userId,
                    'device_id' => $context['device_id'] ?? null,
                    'team_id' => $context['team_id'] ?? null,
                    'subject_type' => $context['subject_type'] ?? null,
                    'subject_id' => $context['subject_id'] ?? null,
                    'correlation_id' => $context['correlation_id'] ?? null,
                    'model_version' => self::MODEL_VERSION,
                    'privacy_class' => $context['privacy_class'] ?? 'user_private',
                ],
                evidence: (array) ($decision['evidence'] ?? []),
            );
        }

        $observedAt = null;
        if (is_string($context['observed_at'] ?? null)) {
            try {
                $observedAt = new \DateTimeImmutable($context['observed_at']);
            } catch (\Throwable) {
                $observedAt = null;
            }
        }
        $persona = $this->persona->observe(
            $userId,
            $input,
            $observedAt,
            isset($context['observation_id']) ? (string) $context['observation_id'] : null,
            isset($context['device_id']) ? (string) $context['device_id'] : null,
        );

        $escalation = $this->escalationDecision($decision, $context);

        return [
            'mode' => 'offline',
            'model_version' => self::MODEL_VERSION,
            'perception' => $perception,
            'persona' => $persona,
            'decision' => $decision,
            'suggestions' => $suggestions,
            'prediction' => $prediction,
            'confidence' => $decision['confidence'],
            'escalation' => $escalation,
            'audit' => ['processed_at' => gmdate(DATE_ATOM), 'cloud_used' => false],
        ];
    }


    /**
     * LocalBrain never calls TitanAI directly. It only reports whether the
     * caller should escalate an uncertain interaction to TitanAI when online.
     */
    private function escalationDecision(array $decision, array $context): array
    {
        $minimumConfidence = max(0.0, min(1.0, (float) ($context['minimum_confidence'] ?? 0.65)));
        $uncertain = (bool) ($decision['needs_clarification'] ?? false)
            || (float) ($decision['confidence'] ?? 0.0) < $minimumConfidence;
        if (!$uncertain) {
            return ['status' => 'not_required', 'target' => null, 'reason' => null];
        }

        $online = filter_var($context['online'] ?? false, FILTER_VALIDATE_BOOL);
        return [
            'status' => $online ? 'recommended' : 'deferred',
            'target' => 'titan_ai',
            'reason' => $online
                ? 'Local confidence is insufficient; TitanAI may interpret the interaction when connectivity is available.'
                : 'Local confidence is insufficient and cloud escalation is deferred until connectivity returns.',
        ];
    }

    /** @param list<array<string, mixed>> $candidates @return array<string, mixed> */
    public function rankMemories(array $candidates, ?\DateTimeInterface $now = null, int $limit = 5): array
    {
        return $this->memoryReranker->rank($candidates, $now, $limit);
    }

    public function confirmAction(string|int $userId, string $action, array $context = []): void
    {
        $this->memory->recordAction($userId, $action, $context);
        if ($this->decisionRecorder !== null) {
            $this->decisionRecorder->recordUserDecision(
                companyId: $this->resolveCompanyContext($context),
                action: $action,
                approved: true,
                scope: [
                    'user_id' => (string) $userId,
                    'device_id' => $context['device_id'] ?? null,
                    'team_id' => $context['team_id'] ?? null,
                    'subject_type' => $context['subject_type'] ?? null,
                    'subject_id' => $context['subject_id'] ?? null,
                    'correlation_id' => $context['correlation_id'] ?? null,
                    'privacy_class' => $context['privacy_class'] ?? 'user_private',
                ],
            );
        }
    }

    private function resolveCompanyContext(array $context): string
    {
        $reportedCompany = trim((string) ($context['company_id'] ?? ''));
        $legacyTenant = trim((string) ($context['company_id'] ?? ''));

        if ($this->companyId !== null) {
            if ($reportedCompany !== '' && $reportedCompany !== $this->companyId) {
                throw new \RuntimeException('LocalBrain company_id does not match the trusted company execution context.');
            }
            if ($legacyTenant !== '' && $legacyTenant !== $this->companyId) {
                throw new \RuntimeException('company_id does not match trusted company_id.');
            }

            return $this->companyId;
        }

        if ($reportedCompany !== '') {
            if ($legacyTenant !== '' && $legacyTenant !== $reportedCompany) {
                throw new \RuntimeException('company_id does not match company_id.');
            }
            return $reportedCompany;
        }

        // Dependency-free standalone mode has no shared persistence and therefore
        // no multi-company boundary. Host construction always supplies company_id.
        return 'local-standalone';
    }

    public function memory(): BehavioralMemory
    {
        return $this->memory;
    }

    public function persona(): BehavioralDriftTracker
    {
        return $this->persona;
    }
}

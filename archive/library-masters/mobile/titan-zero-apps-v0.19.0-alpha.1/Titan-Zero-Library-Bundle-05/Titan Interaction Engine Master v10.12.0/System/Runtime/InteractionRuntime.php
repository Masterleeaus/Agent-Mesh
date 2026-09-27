<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Runtime;

use App\Extensions\InteractionEngine\System\Context\ContextBuilder;
use App\Extensions\InteractionEngine\System\Contracts\CommandBusInterface;
use App\Extensions\InteractionEngine\System\Contracts\EventRecorderInterface;
use App\Extensions\InteractionEngine\System\Contracts\NavigationEngineInterface;
use App\Extensions\InteractionEngine\System\Contracts\OfflineQueueInterface;
use App\Extensions\InteractionEngine\System\Contracts\QuestionResolverInterface;
use App\Extensions\InteractionEngine\System\Contracts\RendererInterface;
use App\Extensions\InteractionEngine\System\Contracts\StateManagerInterface;
use App\Extensions\InteractionEngine\System\Contracts\ValidationEngineInterface;
use App\Extensions\InteractionEngine\System\DTO\Answer;
use App\Extensions\InteractionEngine\System\DTO\AnswerCollection;
use App\Extensions\InteractionEngine\System\DTO\InteractionDefinition;
use App\Extensions\InteractionEngine\System\Offline\OfflineDetector;
use App\Extensions\InteractionEngine\System\Registry\InteractionRegistry;
use App\Extensions\InteractionEngine\System\Settings\SettingsResolver;

class InteractionRuntime
{
    public function __construct(
        private readonly InteractionRegistry $registry,
        private readonly StateManagerInterface $stateManager,
        private readonly NavigationEngineInterface $navigationEngine,
        private readonly ValidationEngineInterface $validationEngine,
        private readonly RendererInterface $renderer,
        private readonly QuestionResolverInterface $questionResolver,
        private readonly ContextBuilder $contextBuilder,
        private readonly EventRecorderInterface $eventRecorder,
        private readonly CommandBusInterface $commandBus,
        private readonly OfflineDetector $offlineDetector,
        private readonly OfflineQueueInterface $offlineQueue,
        private readonly ?SettingsResolver $settings = null,
    ) {}

    public function start(string $interactionId, int $userId, string $companyId): array
    {
        $definition = $this->registry->get($interactionId);
        if ($definition === null) {
            throw new \RuntimeException("Interaction '{$interactionId}' not found.");
        }
        $state = $this->stateManager->start($interactionId, $userId, $companyId);
        $state['definition'] = $definition;
        $this->eventRecorder->record('interaction_started', [
            'run_id' => $state['id'],
            'user_id' => $userId,
            'interaction_id' => $interactionId,
            'definition_version' => $definition->version,
        ]);
        return $state;
    }

    public function loadForActor(int $runId, string $companyId, int|string $userId): array
    {
        $state = $this->stateManager->loadForActor($runId, $companyId, $userId);
        $state['definition'] = $this->registry->get((string) $state['interaction_id']);
        return $state;
    }

    public function getCurrentViewForActor(int $runId, string $companyId, int|string $userId): string
    {
        $state = $this->loadForActor($runId, $companyId, $userId);
        return $this->renderer->render($state['definition'], $state);
    }

    public function process(array $state, array $input): array
    {
        /** @var InteractionDefinition $definition */
        $definition = $state['definition'];
        $action = (string) ($input['action'] ?? 'next');
        $answers = is_array($input['answers'] ?? null) ? $input['answers'] : [];
        $section = $this->stateManager->getCurrentSection($state, $definition);

        if ($action === 'back') {
            $previous = $this->navigationEngine->getPreviousSectionIndex($state, $definition);
            if ($previous !== null) {
                $state['current_section_index'] = $previous;
                $this->stateManager->save($state);
            }
            return ['state' => $state];
        }

        if ($section && $answers === []) {
            $state = $this->autoResolve($state, $section->questions);
        }

        if ($section) {
            $allValues = $this->answerMap($state);
            $allValues = array_replace($allValues, $answers);
            $errors = [];
            foreach ($section->questions as $question) {
                $fieldErrors = $this->validationEngine->validate($question, $allValues[$question->key] ?? null, $allValues);
                if ($fieldErrors !== []) {
                    $errors[$question->key] = $fieldErrors;
                }
            }
            if ($errors !== []) {
                return ['errors' => $errors, 'state' => $state];
            }
        }

        if ($answers !== []) {
            $objects = [];
            foreach ($answers as $key => $value) {
                $objects[] = new Answer((string) $key, $value, 'user', 1.0, new \DateTimeImmutable(), true);
                $this->eventRecorder->record('question_answered', [
                    'run_id' => $state['id'],
                    'question_key' => (string) $key,
                    'source' => 'user',
                ]);
            }
            $state = $this->stateManager->updateAnswers($state, new AnswerCollection(...$objects));
        }

        $next = $this->navigationEngine->getNextSectionIndex($state, $definition);
        if ($next === null || $action === 'submit') {
            $payload = $this->buildPayload($state);
            $this->executeOrQueue($definition->capability, $payload, $state);
            $state = $this->stateManager->setCompleted($state);
            $this->stateManager->save($state);
            $this->eventRecorder->record('interaction_completed', [
                'run_id' => $state['id'],
                'interaction_id' => $definition->id,
                'capability' => $definition->capability,
            ]);
            return ['complete' => true, 'state' => $state];
        }

        if ((int) $state['current_section_index'] !== $next && $section) {
            $this->eventRecorder->record('section_completed', [
                'run_id' => $state['id'],
                'section_id' => $section->id,
                'section_index' => $state['current_section_index'],
            ]);
        }
        $state['current_section_index'] = $next;
        $this->stateManager->save($state);
        return ['state' => $state];
    }

    private function autoResolve(array $state, array $questions): array
    {
        $context = $this->contextBuilder->build($state);
        $resolved = [];
        foreach ($questions as $question) {
            $answer = $this->questionResolver->resolve($question, $context);
            if ($answer->value !== null && $answer->source !== 'user') {
                $resolved[] = $answer;
                $this->eventRecorder->record('question_answered', [
                    'run_id' => $state['id'],
                    'question_key' => $question->key,
                    'source' => $answer->source,
                    'confidence' => $answer->confidence,
                ]);
            }
        }
        return $resolved === [] ? $state : $this->stateManager->updateAnswers($state, new AnswerCollection(...$resolved));
    }

    private function executeOrQueue(string $capability, array $payload, array $state): void
    {
        $companyId = trim((string) ($state['company_id'] ?? ''));
        $offlineAllowed = $companyId !== ''
            ? ($this->settings?->companyBool($companyId, 'offline_enabled', (bool) config('interaction-engine.offline.enabled', true)) ?? (bool) config('interaction-engine.offline.enabled', true))
            : (bool) config('interaction-engine.offline.enabled', true);
        if ($offlineAllowed && $this->offlineDetector->isOffline()) {
            if ($companyId === '') {
                throw new \RuntimeException('Offline command queueing requires trusted company company context.');
            }
            $this->offlineQueue->queue($companyId, $capability, $payload, [
                'run_id' => $state['id'],
                'company_id' => $companyId,
                'user_id' => $state['user_id'],
                'device_id' => $state['device_id'] ?? null,
                'queued_at' => gmdate(DATE_ATOM),
            ]);
            return;
        }
        $this->commandBus->dispatch($capability, $payload);
    }

    private function answerMap(array $state): array
    {
        $map = [];
        foreach ($state['answers'] ?? [] as $answer) {
            if (is_object($answer) && isset($answer->questionKey)) {
                $map[$answer->questionKey] = $answer->value;
            }
        }
        return $map;
    }

    private function buildPayload(array $state): array
    {
        $payload = $this->answerMap($state);
        $payload['interaction_id'] = $state['interaction_id'];
        $payload['run_id'] = $state['id'];
        $payload['_context'] = array_replace((array) ($payload['_context'] ?? []), [
            'company_id' => $state['company_id'] ?? null,
            'company_id' => $state['company_id'] ?? null, // compatibility alias only
            'user_id' => $state['user_id'] ?? null,
            'actor_type' => 'human',
        ]);
        return $payload;
    }
}

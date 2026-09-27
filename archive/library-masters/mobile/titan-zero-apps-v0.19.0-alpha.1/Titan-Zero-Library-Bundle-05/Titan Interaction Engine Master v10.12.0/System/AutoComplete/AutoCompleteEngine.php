<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\AutoComplete;

use App\Extensions\InteractionEngine\System\Context\ContextBuilder;
use App\Extensions\InteractionEngine\System\Contracts\LearnerInterface;
use App\Extensions\InteractionEngine\System\Contracts\PredictorInterface;
use App\Extensions\InteractionEngine\System\DTO\Question;
use App\Extensions\InteractionEngine\System\DTO\Section;
use App\Extensions\InteractionEngine\System\Registry\InteractionRegistry;
use App\Extensions\InteractionEngine\System\Runtime\InteractionRuntime;

class AutoCompleteEngine
{
    public function __construct(
        private readonly InteractionRuntime $runtime,
        private readonly InteractionRegistry $registry,
        private readonly ContextBuilder $contextBuilder,
        private readonly PredictorInterface $predictor,
        private readonly LearnerInterface $learner,
    ) {}

    public function autoComplete(int $userId, string $interactionId, array $initialData = []): array
    {
        $state = $this->runtime->start($interactionId, $userId);
        $context = array_replace_recursive($this->contextBuilder->build($state), $initialData);
        $steps = [];
        $safety = 0;
        while (($state['state'] ?? '') !== 'completed' && $safety++ < 100) {
            $section = $this->getCurrentSection($state);
            if (!$section) {
                break;
            }
            $answers = [];
            foreach ($section->questions as $question) {
                $answer = $this->resolveQuestion($question, $context, $userId);
                if ($answer['value'] === null && ($question->validation['required'] ?? false)) {
                    return ['completed' => false, 'requires_user_input' => $question->key, 'steps' => $steps, 'state' => $state];
                }
                $answers[$question->key] = $answer['value'];
                $steps[] = ['section' => $section->id, 'question' => $question->key] + $answer;
            }
            $result = $this->runtime->process($state, ['answers' => $answers, 'action' => 'next']);
            if (isset($result['errors'])) {
                return ['completed' => false, 'errors' => $result['errors'], 'steps' => $steps, 'state' => $state];
            }
            $state = $result['state'];
            if ($result['complete'] ?? false) {
                break;
            }
        }
        $completed = ($state['state'] ?? '') === 'completed';
        $this->learner->learn($userId, [
            'type' => 'auto_completed',
            'interaction_id' => $interactionId,
            'steps' => $steps,
            'success' => $completed,
            'timestamp' => gmdate(DATE_ATOM),
        ]);
        return ['completed' => $completed, 'steps' => $steps, 'state' => $state];
    }

    public function canAutoComplete(string $interactionId, int $userId): bool
    {
        $this->registry->get($interactionId);
        $patterns = $this->learner->getPatterns($userId);
        foreach ($patterns['auto_completed'] ?? [] as $event) {
            if (($event['event']['interaction_id'] ?? $event['interaction_id'] ?? null) === $interactionId) {
                return true;
            }
        }
        $count = 0;
        foreach ($patterns['interaction_completed'] ?? [] as $event) {
            if (($event['event']['interaction_id'] ?? $event['interaction_id'] ?? null) === $interactionId) {
                $count++;
            }
        }
        return $count >= 3;
    }

    private function resolveQuestion(Question $question, array $context, int $userId): array
    {
        if (array_key_exists($question->key, $context)) {
            return ['value' => $context[$question->key], 'source' => 'initial_data', 'confidence' => 0.95];
        }
        foreach ($this->learner->getPatterns($userId) as $events) {
            foreach (array_reverse((array) $events) as $event) {
                $answers = $event['event']['answers'] ?? $event['answers'] ?? [];
                if (array_key_exists($question->key, $answers)) {
                    return ['value' => $answers[$question->key], 'source' => 'history', 'confidence' => 0.7];
                }
            }
        }
        foreach ($this->predictor->predict($userId, $context) as $prediction) {
            if (isset($prediction['answers'][$question->key])) {
                return ['value' => $prediction['answers'][$question->key], 'source' => 'prediction', 'confidence' => $prediction['confidence'] ?? 0.5];
            }
        }
        return ['value' => $question->default, 'source' => 'default', 'confidence' => $question->default === null ? 0.0 : 0.3];
    }

    private function getCurrentSection(array $state): ?Section
    {
        return $state['definition']->sections[(int) ($state['current_section_index'] ?? 0)] ?? null;
    }
}

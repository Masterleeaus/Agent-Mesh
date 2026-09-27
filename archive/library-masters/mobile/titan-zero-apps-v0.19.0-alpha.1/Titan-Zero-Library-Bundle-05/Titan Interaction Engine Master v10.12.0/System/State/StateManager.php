<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\State;

use App\Extensions\InteractionEngine\System\Contracts\StateManagerInterface;
use App\Extensions\InteractionEngine\System\DTO\AnswerCollection;
use App\Extensions\InteractionEngine\System\DTO\InteractionDefinition;
use App\Extensions\InteractionEngine\System\DTO\Section;
use App\Extensions\InteractionEngine\System\Repositories\InteractionAnswerRepositoryInterface;
use App\Extensions\InteractionEngine\System\Repositories\InteractionRunRepositoryInterface;

class StateManager implements StateManagerInterface
{
    public function __construct(
        private readonly InteractionRunRepositoryInterface $runRepository,
        private readonly InteractionAnswerRepositoryInterface $answerRepository,
    ) {}

    public function start(string $interactionId, int $userId, string $companyId): array
    {
        $runId = $this->runRepository->create($userId, $interactionId, '1.0.0', $companyId);
        return $this->loadForActor($runId, $companyId, $userId);
    }

    public function loadForActor(int $runId, string $companyId, int|string $userId): array
    {
        $run = $this->runRepository->findForActor($runId, $companyId, $userId);
        if (!$run) {
            throw new \RuntimeException("Run {$runId} was not found for the authenticated actor.");
        }
        $run['company_id'] = (string) ($run['company_id'] ?? $companyId);
        $run['answers'] = $this->answerRepository->getAll($runId, $companyId);
        return $run;
    }

    public function save(array $state): void
    {
        $companyId = trim((string) ($state['company_id'] ?? ''));
        $userId = $state['user_id'] ?? null;
        if ($companyId === '' || $userId === null) {
            throw new \RuntimeException('Saving interaction state requires tenant and actor ownership.');
        }
        $this->runRepository->updateForActor((int) $state['id'], $companyId, $userId, [
            'current_section_index' => (int) ($state['current_section_index'] ?? 0),
            'state' => $state['state'] ?? 'in_progress',
            'meta' => $state['meta'] ?? [],
            'completed_at' => $state['completed_at'] ?? null,
        ]);
    }

    public function getCurrentSection(array $state, InteractionDefinition $definition): ?Section
    {
        return $definition->sections[(int) ($state['current_section_index'] ?? 0)] ?? null;
    }

    public function getUnansweredQuestions(array $state, InteractionDefinition $definition): array
    {
        $section = $this->getCurrentSection($state, $definition);
        if (!$section) {
            return [];
        }
        $answered = [];
        foreach ($state['answers'] ?? [] as $answer) {
            if (is_object($answer) && isset($answer->questionKey)) {
                $answered[$answer->questionKey] = $answer->value;
            }
        }
        return array_values(array_filter($section->questions, static fn($question): bool => !array_key_exists($question->key, $answered)));
    }

    public function updateAnswers(array $state, AnswerCollection $answers): array
    {
        foreach ($answers->all() as $answer) {
            $this->answerRepository->save((int) $state['id'], (string) $state['company_id'], $answer);
        }
        $state['answers'] = $this->answerRepository->getAll((int) $state['id'], (string) $state['company_id']);
        $state['state'] = 'in_progress';
        return $state;
    }

    public function setCompleted(array $state): array
    {
        $state['state'] = 'completed';
        $state['completed_at'] = date('Y-m-d H:i:s');
        return $state;
    }
}

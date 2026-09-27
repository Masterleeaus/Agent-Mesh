<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Contracts;

use App\Extensions\InteractionEngine\System\DTO\InteractionDefinition;
use App\Extensions\InteractionEngine\System\DTO\AnswerCollection;
use App\Extensions\InteractionEngine\System\DTO\Section;

interface StateManagerInterface
{
    public function start(string $interactionId, int $userId, string $companyId): array;
    public function loadForActor(int $runId, string $companyId, int|string $userId): array;
    public function save(array $state): void;
    public function getCurrentSection(array $state, InteractionDefinition $definition): ?Section;
    public function getUnansweredQuestions(array $state, InteractionDefinition $definition): array;
    public function updateAnswers(array $state, AnswerCollection $answers): array;
    public function setCompleted(array $state): array;
}

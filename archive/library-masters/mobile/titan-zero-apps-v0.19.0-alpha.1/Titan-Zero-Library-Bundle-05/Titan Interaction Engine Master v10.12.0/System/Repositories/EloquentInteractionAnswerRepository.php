<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Repositories;

use App\Extensions\InteractionEngine\System\DTO\Answer;
use App\Extensions\InteractionEngine\System\Models\InteractionAnswer;

final class EloquentInteractionAnswerRepository implements InteractionAnswerRepositoryInterface
{
    public function save(int $runId, string $companyId, Answer $answer): void
    {
        $companyId = $this->requireCompany($companyId);
        InteractionAnswer::updateOrCreate(
            ['company_id' => $companyId, 'run_id' => $runId, 'question_key' => $answer->questionKey],
            [
                'company_id' => $companyId,
                'value' => $answer->value,
                'source' => $answer->source,
                'confidence' => $answer->confidence,
                'answered_at' => $answer->timestamp ?? now(),
                'edited_by_user' => $answer->editedByUser,
                'edited_by_ai' => $answer->editedByAI,
                'validation_state' => $answer->validationState,
            ]
        );
    }

    public function getAll(int $runId, string $companyId): array
    {
        $companyId = $this->requireCompany($companyId);
        $records = InteractionAnswer::query()
            ->where('company_id', $companyId)
            ->where('run_id', $runId)
            ->limit(5000)->get();
        $answers = [];
        foreach ($records as $record) {
            $answers[] = new Answer(
                questionKey: $record->question_key,
                value: $record->value,
                source: $record->source,
                confidence: $record->confidence,
                timestamp: $record->answered_at ? new \DateTimeImmutable($record->answered_at) : null,
                editedByUser: (bool) $record->edited_by_user,
                editedByAI: (bool) $record->edited_by_ai,
                validationState: $record->validation_state,
            );
        }
        return $answers;
    }

    private function requireCompany(string $companyId): string
    {
        $companyId = trim($companyId);
        if ($companyId === '') {
            throw new \InvalidArgumentException('Interaction answer operations require company company context.');
        }
        return $companyId;
    }
}

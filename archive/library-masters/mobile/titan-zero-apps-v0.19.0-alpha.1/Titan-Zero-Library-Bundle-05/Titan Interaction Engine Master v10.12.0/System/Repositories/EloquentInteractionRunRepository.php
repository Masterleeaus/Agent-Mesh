<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Repositories;

use App\Extensions\InteractionEngine\System\Models\InteractionRun;

final class EloquentInteractionRunRepository implements InteractionRunRepositoryInterface
{
    public function create(int $userId, string $interactionId, string $definitionVersion, string $companyId): int
    {
        $companyId = $this->requireCompany($companyId);
        $run = InteractionRun::create([
            'company_id' => $companyId,
            'user_id' => $userId,
            'interaction_id' => $interactionId,
            'definition_version' => $definitionVersion,
            'current_section_index' => 0,
            'answers' => [],
            'state' => 'started',
            'meta' => [],
        ]);
        return (int) $run->id;
    }

    public function findForActor(int $runId, string $companyId, int|string $userId): ?array
    {
        $companyId = $this->requireCompany($companyId);
        $run = InteractionRun::query()
            ->where('id', $runId)
            ->where('company_id', $companyId)
            ->where('user_id', $userId)
            ->first();

        return $run ? $run->toArray() : null;
    }

    public function updateForActor(int $runId, string $companyId, int|string $userId, array $data): void
    {
        $companyId = $this->requireCompany($companyId);
        InteractionRun::query()
            ->where('id', $runId)
            ->where('company_id', $companyId)
            ->where('user_id', $userId)
            ->update($data);
    }

    public function findActiveForUser(string $companyId, int $userId, string $interactionId): ?array
    {
        $companyId = $this->requireCompany($companyId);
        $run = InteractionRun::query()
            ->where('company_id', $companyId)
            ->where('user_id', $userId)
            ->where('interaction_id', $interactionId)
            ->whereIn('state', ['started', 'in_progress'])
            ->latest()
            ->first();
        return $run ? $run->toArray() : null;
    }

    private function requireCompany(string $companyId): string
    {
        $companyId = trim($companyId);
        if ($companyId === '') {
            throw new \InvalidArgumentException('Interaction run repository operations require company company context.');
        }
        return $companyId;
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Repositories;

interface InteractionRunRepositoryInterface
{
    public function create(int $userId, string $interactionId, string $definitionVersion, string $companyId): int;
    public function findForActor(int $runId, string $companyId, int|string $userId): ?array;
    public function updateForActor(int $runId, string $companyId, int|string $userId, array $data): void;
    public function findActiveForUser(string $companyId, int $userId, string $interactionId): ?array;
}

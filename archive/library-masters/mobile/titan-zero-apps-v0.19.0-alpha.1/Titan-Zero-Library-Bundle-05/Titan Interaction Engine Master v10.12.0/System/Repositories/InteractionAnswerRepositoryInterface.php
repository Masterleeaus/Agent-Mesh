<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Repositories;

use App\Extensions\InteractionEngine\System\DTO\Answer;

interface InteractionAnswerRepositoryInterface
{
    public function save(int $runId, string $companyId, Answer $answer): void;
    public function getAll(int $runId, string $companyId): array;
}

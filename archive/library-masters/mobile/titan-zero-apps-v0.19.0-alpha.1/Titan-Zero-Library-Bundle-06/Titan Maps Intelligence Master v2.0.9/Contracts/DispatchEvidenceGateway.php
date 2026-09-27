<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

use App\Extensions\TitanMapsIntelligence\DTO\DispatchJobContext;

interface DispatchEvidenceGateway
{
    public function job(string $companyId, string $jobPublicId): ?DispatchJobContext;

    /**
     * @param array<string,mixed> $worker
     * @return array<string,mixed>
     */
    public function workerEvidence(string $companyId, DispatchJobContext $job, array $worker): array;
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

use App\Extensions\TitanMapsIntelligence\DTO\DispatchJobContext;

interface WorkerQualificationGateway
{
    /** @return array{status:string,skills:array<int,string>,certifications:array<int,array<string,mixed>>,source:string} */
    public function evidence(string $companyId, string $workerPublicId, string $workerUserId, DispatchJobContext $job): array;
}

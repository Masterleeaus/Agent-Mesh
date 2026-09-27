<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\WorkerQualificationGateway;
use App\Extensions\TitanMapsIntelligence\DTO\DispatchJobContext;

final class UnknownWorkerQualificationGateway implements WorkerQualificationGateway
{
    public function evidence(string $companyId, string $workerPublicId, string $workerUserId, DispatchJobContext $job): array
    {
        return ['status'=>'unknown','skills'=>[],'certifications'=>[],'source'=>'unavailable'];
    }
}

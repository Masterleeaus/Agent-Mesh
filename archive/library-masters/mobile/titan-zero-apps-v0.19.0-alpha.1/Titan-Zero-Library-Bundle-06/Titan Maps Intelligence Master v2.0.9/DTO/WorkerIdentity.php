<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;

final readonly class WorkerIdentity
{
    public function __construct(
        public string $companyId,
        public string $userId,
        public string $workerPublicId,
        public ?string $branchId = null,
        public ?string $workspaceId = null,
    ) {
        if (trim($companyId) === '' || trim($userId) === '' || trim($workerPublicId) === '') {
            throw MapsIntelligenceException::fromCode('MAPS_WORKER_IDENTITY_INVALID', 'Worker tracking requires company, user and worker identifiers.');
        }
    }
}

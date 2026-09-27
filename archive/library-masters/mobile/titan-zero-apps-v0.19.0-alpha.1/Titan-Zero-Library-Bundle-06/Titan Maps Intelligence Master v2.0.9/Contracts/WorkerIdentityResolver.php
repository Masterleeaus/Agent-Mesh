<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

use App\Extensions\TitanMapsIntelligence\DTO\WorkerIdentity;

interface WorkerIdentityResolver
{
    /** Resolve only the worker identity owned by the authenticated user inside the supplied company. Never trust a client worker reference without host-side ownership validation. */
    public function resolve(string $companyId, string $userId, ?string $requestedWorkerPublicId = null): WorkerIdentity;
}

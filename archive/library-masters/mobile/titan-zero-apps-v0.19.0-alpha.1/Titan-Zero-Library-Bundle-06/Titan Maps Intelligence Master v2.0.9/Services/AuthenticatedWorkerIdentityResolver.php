<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\WorkerIdentityResolver;
use App\Extensions\TitanMapsIntelligence\DTO\WorkerIdentity;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;

final class AuthenticatedWorkerIdentityResolver implements WorkerIdentityResolver
{
    public function __construct(private readonly AuthorisedCompanyContext $context) {}

    public function resolve(string $companyId, string $userId, ?string $requestedWorkerPublicId = null): WorkerIdentity
    {
        if (! hash_equals($this->context->companyId(), $companyId) || ! hash_equals($this->context->userId(), $userId)) {
            throw MapsIntelligenceException::fromCode('MAPS_TENANT_DENIED', 'Worker identity must match the authenticated company and user context.');
        }

        $user = auth()->user();
        if ($user === null) {
            throw MapsIntelligenceException::fromCode('MAPS_WORKER_IDENTITY_UNAVAILABLE', 'An authenticated worker identity is required.');
        }

        $workerId = $this->firstUserValue($user, ['worker_public_id', 'worker_id', 'staff_id', 'id']);
        if ($workerId === null) {
            $workerId = $userId;
        }

        $requested = $requestedWorkerPublicId === null ? null : trim($requestedWorkerPublicId);
        if ($requested !== null && $requested !== '' && ! hash_equals($workerId, $requested)) {
            throw MapsIntelligenceException::fromCode('MAPS_WORKER_REFERENCE_DENIED', 'The requested worker reference does not belong to the authenticated worker.');
        }

        return new WorkerIdentity(
            companyId: $companyId,
            userId: $userId,
            workerPublicId: $workerId,
            branchId: $this->context->branchId(),
            workspaceId: $this->context->workspaceId(),
        );
    }

    private function firstUserValue(object $user, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = null;
            if (isset($user->{$key}) || property_exists($user, $key)) {
                $value = $user->{$key};
            } elseif (method_exists($user, 'getAttribute')) {
                $value = $user->getAttribute($key);
            }
            if (is_scalar($value) && trim((string) $value) !== '') {
                return trim((string) $value);
            }
        }
        return null;
    }
}

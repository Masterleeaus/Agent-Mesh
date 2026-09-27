<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

/**
 * Stable spatial peer surface for Titan Field. All methods are tenant-scoped,
 * spatial-only and must not directly mutate Titan Field operational state.
 */
interface FieldSpatialPeerGateway
{
    public function healthy(string $companyId): bool;

    /** @param array<int,int|string> $workerUserIds @return array<int,array<string,mixed>> */
    public function latestWorkerPositions(string $companyId, array $workerUserIds = []): array;

    /** @param array{latitude:float|int,longitude:float|int} $origin @param array{latitude:float|int,longitude:float|int} $destination @return array<string,mixed> */
    public function estimateTravel(string $companyId, array $origin, array $destination, array $context = []): array;

    /** @return array<string,mixed> */
    public function recordWorkerLocation(string $companyId, string $userId, array $payload): array;

    /** Offline-safe bounded worker location replay. @return array<string,mixed> */
    public function syncOfflineWorkerLocations(string $companyId, string $userId, array $samples, array $context = []): array;

    /** Read-only spatial/travel/territory evidence for Field profitability. @return array<string,mixed> */
    public function workOrderCostEvidence(string $companyId, string $workOrderPublicId, array $context = []): array;

    /** Read-only spatial capacity pressure for Field forecasting. @return array<string,mixed> */
    public function capacityPressureEvidence(string $companyId, array $context = []): array;

    /** Read-only explainable route optimisation proposal for Titan Field. No Field mutation. @return array<string,mixed> */
    public function routeOptimizationProposal(string $companyId, string $fieldRoutePublicId, array $route, array $stops, array $context = []): array;

    /** @return array<string,mixed> */
    public function mapPayload(string $companyId, string $page = 'field.team'): array;

    /** @return array<string,mixed> */
    public function mapUi(): array;
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialSignalPublisher;
use App\Extensions\TitanMapsIntelligence\DTO\RouteCalculationResult;
use App\Extensions\TitanMapsIntelligence\DTO\RouteRequest;
use App\Extensions\TitanMapsIntelligence\Exceptions\ProviderException;
use App\Extensions\TitanMapsIntelligence\Models\EtaSnapshot;
use App\Extensions\TitanMapsIntelligence\Models\RouteSnapshot;
use Carbon\CarbonImmutable;

final class RouteCalculationService
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly RoutingService $routing,
        private readonly GeoDistanceService $distance,
        private readonly MapsConfiguration $configuration,
        private readonly SpatialSignalPublisher $signals,
        private readonly SpatialExecutionContextStore $executionContexts,
        private readonly SpatialExecutionContextFactory $contextFactory,
        private readonly RouteFreshnessPolicy $freshnessPolicy,
    ) {}

    public function calculate(RouteRequest $request, ?string $providerId = null): RouteCalculationResult
    {
        $companyId = $this->context->companyId();
        $signature = $this->requestSignature($request);
        $straightLineMetres = (int) round($this->distance->kilometres(
            $request->origin->latitude,
            $request->origin->longitude,
            $request->destination->latitude,
            $request->destination->longitude,
        ) * 1000);

        try {
            $providerResult = $this->routing->route($request, $providerId);
            $now = CarbonImmutable::now('UTC');
            $staleAt = $now->addSeconds($request->isTrafficAware()
                ? $this->configuration->trafficAwareRouteTtlSeconds()
                : $this->configuration->trafficUnawareRouteTtlSeconds());
            $trafficBasis = $request->isTrafficAware() ? 'traffic_aware' : 'traffic_unaware';
            $validUntil=$now->addSeconds($this->freshnessPolicy->validForSeconds($trafficBasis));

            return $this->persistResult(
                request: $request,
                signature: $signature,
                basis: 'provider_route',
                provider: $providerResult->provider,
                roadDistanceMetres: $providerResult->distanceMetres,
                straightLineDistanceMetres: $straightLineMetres,
                durationSeconds: $providerResult->durationSeconds,
                staticDurationSeconds: $providerResult->staticDurationSeconds,
                trafficDelaySeconds: $providerResult->trafficDelaySeconds(),
                trafficBasis: $trafficBasis,
                encodedPolyline: $providerResult->encodedPolyline,
                calculatedAt: $now,
                staleAt: $staleAt,
                sourceSnapshotId: null,
                providerErrorCode: null,
                validUntil: $validUntil,
            );
        } catch (ProviderException $exception) {
            if ($exception->errorCode() === 'MAPS_PROVIDER_QUOTA_EXCEEDED') {
                throw $exception;
            }
            $signalContext=$this->executionContexts->current() ?? $this->contextFactory->fromInput('route.estimate', []);
            $this->signals->publish('maps.route.failed',$signalContext,['request_signature'=>$signature,'provider_error_code'=>$exception->errorCode()]);
            $fallback = $this->lastValidProviderSnapshot($companyId, $signature);
            if ($fallback !== null) {
                $eta = $fallback->eta;
                $sourceCalculatedAt = CarbonImmutable::parse((string) $fallback->calculated_at, 'UTC');
                $sourceStaleAt = $fallback->stale_at !== null ? CarbonImmutable::parse((string) $fallback->stale_at, 'UTC') : $sourceCalculatedAt;
                $result=$this->persistResult(
                    request: $request,
                    signature: $signature,
                    basis: 'last_valid_snapshot',
                    provider: $fallback->provider,
                    roadDistanceMetres: $fallback->road_distance_metres === null ? null : (int) $fallback->road_distance_metres,
                    straightLineDistanceMetres: $straightLineMetres,
                    durationSeconds: $eta?->duration_seconds === null ? null : (int) $eta->duration_seconds,
                    staticDurationSeconds: $eta?->static_duration_seconds === null ? null : (int) $eta->static_duration_seconds,
                    trafficDelaySeconds: $eta?->traffic_delay_seconds === null ? null : (int) $eta->traffic_delay_seconds,
                    trafficBasis: 'stale_snapshot',
                    encodedPolyline: $fallback->encoded_polyline,
                    calculatedAt: $sourceCalculatedAt,
                    staleAt: $sourceStaleAt,
                    sourceSnapshotId: (string) $fallback->id,
                    providerErrorCode: $exception->errorCode(),
                    validUntil: $eta?->valid_until !== null ? CarbonImmutable::parse((string)$eta->valid_until,'UTC') : $sourceStaleAt,
                );
                $this->signals->publish('maps.route.fallback_used',$signalContext,['request_signature'=>$signature,'fallback_basis'=>'last_valid_snapshot','provider_error_code'=>$exception->errorCode(),'source_snapshot_id'=>$result->sourceSnapshotId]);
                return $result;
            }

            $now = CarbonImmutable::now('UTC');
            $result=$this->persistResult(
                request: $request,
                signature: $signature,
                basis: 'straight_line_estimate',
                provider: null,
                roadDistanceMetres: null,
                straightLineDistanceMetres: $straightLineMetres,
                durationSeconds: null,
                staticDurationSeconds: null,
                trafficDelaySeconds: null,
                trafficBasis: 'unavailable',
                encodedPolyline: null,
                calculatedAt: $now,
                staleAt: null,
                sourceSnapshotId: null,
                providerErrorCode: $exception->errorCode(),
            );
            $this->signals->publish('maps.route.fallback_used',$signalContext,['request_signature'=>$signature,'fallback_basis'=>'straight_line_estimate','provider_error_code'=>$exception->errorCode()]);
            return $result;
        }
    }

    public function requestSignature(RouteRequest $request): string
    {
        $precision = $this->configuration->routeCoordinatePrecisionDecimals();
        return hash('sha256', implode('|', [
            number_format(round($request->origin->latitude, $precision), $precision, '.', ''),
            number_format(round($request->origin->longitude, $precision), $precision, '.', ''),
            number_format(round($request->destination->latitude, $precision), $precision, '.', ''),
            number_format(round($request->destination->longitude, $precision), $precision, '.', ''),
            $request->travelMode,
            $request->routingPreference,
        ]));
    }

    private function lastValidProviderSnapshot(string $companyId, string $signature): ?RouteSnapshot
    {
        $cutoff = CarbonImmutable::now('UTC')->subHours($this->configuration->lastValidRouteMaxAgeHours());
        return RouteSnapshot::query()->forCompany($companyId)
            ->with('eta')
            ->where('request_signature', $signature)
            ->where('result_basis', 'provider_route')
            ->whereNotNull('road_distance_metres')
            ->where('calculated_at', '>=', $cutoff)
            ->latest('calculated_at')
            ->first();
    }

    private function persistResult(
        RouteRequest $request,
        string $signature,
        string $basis,
        ?string $provider,
        ?int $roadDistanceMetres,
        int $straightLineDistanceMetres,
        ?int $durationSeconds,
        ?int $staticDurationSeconds,
        ?int $trafficDelaySeconds,
        string $trafficBasis,
        ?string $encodedPolyline,
        CarbonImmutable $calculatedAt,
        ?CarbonImmutable $staleAt,
        ?string $sourceSnapshotId,
        ?string $providerErrorCode,
        ?CarbonImmutable $validUntil = null,
    ): RouteCalculationResult {
        $companyId = $this->context->companyId();
        $route = RouteSnapshot::query()->create([
            'company_id' => $companyId,
            'branch_id' => $this->context->branchId(),
            'workspace_id' => $this->context->workspaceId(),
            'request_signature' => $signature,
            'origin_latitude' => $request->origin->latitude,
            'origin_longitude' => $request->origin->longitude,
            'destination_latitude' => $request->destination->latitude,
            'destination_longitude' => $request->destination->longitude,
            'travel_mode' => $request->travelMode,
            'routing_preference' => $request->routingPreference,
            'provider' => $provider,
            'result_basis' => $basis,
            'source_snapshot_id' => $sourceSnapshotId,
            'road_distance_metres' => $roadDistanceMetres,
            'straight_line_distance_metres' => $straightLineDistanceMetres,
            'encoded_polyline' => $encodedPolyline,
            'provider_error_code' => $providerErrorCode,
            'worker_public_id'=>$request->workerPublicId,'customer_public_id'=>$request->customerPublicId,
            'origin_reference_type'=>$request->originReferenceType,'origin_public_reference_id'=>$request->originPublicReferenceId,
            'destination_reference_type'=>$request->destinationReferenceType,'destination_public_reference_id'=>$request->destinationPublicReferenceId,
            'metadata' => ['configuration_version' => $this->configuration->version()],
            'calculated_at' => $calculatedAt,
            'stale_at' => $staleAt,
            'created_by_user_id' => $this->context->userId(),
        ]);

        $eta = EtaSnapshot::query()->create([
            'company_id' => $companyId,
            'route_snapshot_id' => (string) $route->id,
            'provider' => $provider,
            'result_basis' => $basis,
            'traffic_basis' => $trafficBasis,
            'duration_seconds' => $durationSeconds,
            'static_duration_seconds' => $staticDurationSeconds,
            'traffic_delay_seconds' => $trafficDelaySeconds,
            'calculated_at' => $calculatedAt,
            'stale_at' => $staleAt,
            'valid_until' => $validUntil ?? $staleAt,
            'metadata' => ['configuration_version' => $this->configuration->version()],
        ]);

        return new RouteCalculationResult(
            basis: $basis,
            provider: $provider,
            roadDistanceMetres: $roadDistanceMetres,
            straightLineDistanceMetres: $straightLineDistanceMetres,
            durationSeconds: $durationSeconds,
            staticDurationSeconds: $staticDurationSeconds,
            trafficDelaySeconds: $trafficDelaySeconds,
            trafficBasis: $trafficBasis,
            encodedPolyline: $encodedPolyline,
            calculatedAt: $calculatedAt->toDateTimeImmutable(),
            staleAt: $staleAt?->toDateTimeImmutable(),
            routeSnapshotId: (string) $route->id,
            etaSnapshotId: (string) $eta->id,
            sourceSnapshotId: $sourceSnapshotId,
            providerErrorCode: $providerErrorCode,
            validUntil: ($validUntil ?? $staleAt)?->toDateTimeImmutable(),
        );
    }
}

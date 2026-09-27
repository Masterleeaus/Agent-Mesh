<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixRequest;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Models\TravelMatrixElement;
use App\Extensions\TitanMapsIntelligence\Models\TravelMatrixSnapshot;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

final class TravelMatrixService
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly RoutingService $routing,
        private readonly MapsConfiguration $configuration,
        private readonly GeoDistanceService $distance,
    ) {}

    /**
     * @param array<int,array{reference_type?:string,public_reference_id?:string,label?:string}> $originRefs
     * @param array<int,array{reference_type?:string,public_reference_id?:string,label?:string}> $destinationRefs
     * @return array{snapshot:TravelMatrixSnapshot,cache_status:string}
     */
    public function calculate(RouteMatrixRequest $request, array $originRefs = [], array $destinationRefs = []): array
    {
        $this->configuration->assertMatrixLimits(count($request->origins), count($request->destinations), $request->routingPreference, $request->travelMode);
        $companyId = $this->context->companyId();
        $signature = $this->signature($request);
        $now = CarbonImmutable::now('UTC');
        $freshCutoff = $now->subSeconds($this->configuration->matrixCacheTtlSeconds($request->isTrafficAware()));

        $fresh = TravelMatrixSnapshot::query()->forCompany($companyId)
            ->with('elements')->where('request_signature', $signature)->where('result_basis', 'provider_matrix')
            ->where('calculated_at', '>=', $freshCutoff)->latest('calculated_at')->first();
        if ($fresh !== null) {
            return ['snapshot' => $fresh, 'cache_status' => 'fresh_cache'];
        }

        try {
            $result = $this->routing->matrix($request);
            $snapshot = $this->persistProviderResult($request, $result->provider, $result->elements, $signature, $originRefs, $destinationRefs, $now);
            return ['snapshot' => $snapshot, 'cache_status' => 'provider'];
        } catch (MapsIntelligenceException $exception) {
            if ($exception->errorCode() === 'MAPS_PROVIDER_QUOTA_EXCEEDED') {
                throw $exception;
            }
            $cutoff = $now->subHours($this->configuration->matrixLastValidMaxAgeHours());
            $last = TravelMatrixSnapshot::query()->forCompany($companyId)
                ->with('elements')->where('request_signature', $signature)->where('result_basis', 'provider_matrix')
                ->where('calculated_at', '>=', $cutoff)->latest('calculated_at')->first();
            if ($last !== null) {
                $copy = $this->cloneStale($last, $request, $originRefs, $destinationRefs, $exception->errorCode(), $now);
                return ['snapshot' => $copy, 'cache_status' => 'stale_cache'];
            }
            $estimate = $this->persistEstimate($request, $signature, $originRefs, $destinationRefs, $exception->errorCode(), $now);
            return ['snapshot' => $estimate, 'cache_status' => 'straight_line_estimate'];
        }
    }

    public function signature(RouteMatrixRequest $request): string
    {
        $precision = $this->configuration->routeCoordinatePrecisionDecimals();
        $normalise = static fn (Coordinates $c): array => [
            number_format(round($c->latitude, $precision), $precision, '.', ''),
            number_format(round($c->longitude, $precision), $precision, '.', ''),
        ];
        return hash('sha256', json_encode([
            'origins' => array_map($normalise, $request->origins),
            'destinations' => array_map($normalise, $request->destinations),
            'travel_mode' => $request->travelMode,
            'routing_preference' => $request->routingPreference,
            'departure_time' => $request->departureTime,
        ], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
    }

    /** @param array<int,mixed> $providerElements */
    private function persistProviderResult(RouteMatrixRequest $request, string $provider, array $providerElements, string $signature, array $originRefs, array $destinationRefs, CarbonImmutable $now): TravelMatrixSnapshot
    {
        return DB::transaction(function () use ($request, $provider, $providerElements, $signature, $originRefs, $destinationRefs, $now): TravelMatrixSnapshot {
            $snapshot = $this->createSnapshot($request, $signature, 'provider_matrix', $provider, null, null, $originRefs, $destinationRefs, $now, $now->addSeconds($this->configuration->matrixCacheTtlSeconds($request->isTrafficAware())));
            foreach ($providerElements as $element) {
                $origin = $request->origins[$element->originIndex] ?? null;
                $destination = $request->destinations[$element->destinationIndex] ?? null;
                if (!$origin instanceof Coordinates || !$destination instanceof Coordinates) continue;
                $this->createElement($snapshot, $origin, $destination, $element->originIndex, $element->destinationIndex, $originRefs[$element->originIndex] ?? [], $destinationRefs[$element->destinationIndex] ?? [], $element->distanceMetres, $element->durationSeconds, $element->staticDurationSeconds, $element->trafficDelaySeconds(), $element->condition, 'provider');
            }
            return $snapshot->load('elements');
        });
    }

    private function cloneStale(TravelMatrixSnapshot $source, RouteMatrixRequest $request, array $originRefs, array $destinationRefs, string $errorCode, CarbonImmutable $now): TravelMatrixSnapshot
    {
        return DB::transaction(function () use ($source, $request, $originRefs, $destinationRefs, $errorCode, $now): TravelMatrixSnapshot {
            $snapshot = $this->createSnapshot($request, $this->signature($request), 'stale_matrix_snapshot', $source->provider, (string)$source->id, $errorCode, $originRefs, $destinationRefs, $source->calculated_at?->toImmutable() ?? $now, $now);
            foreach ($source->elements as $element) {
                $origin = $request->origins[(int)$element->origin_index] ?? null;
                $destination = $request->destinations[(int)$element->destination_index] ?? null;
                if (!$origin instanceof Coordinates || !$destination instanceof Coordinates) continue;
                $this->createElement($snapshot, $origin, $destination, (int)$element->origin_index, (int)$element->destination_index, $originRefs[(int)$element->origin_index] ?? [], $destinationRefs[(int)$element->destination_index] ?? [], $element->distance_metres, $element->duration_seconds, $element->static_duration_seconds, $element->traffic_delay_seconds, (string)$element->condition, 'stale_snapshot');
            }
            return $snapshot->load('elements');
        });
    }

    private function persistEstimate(RouteMatrixRequest $request, string $signature, array $originRefs, array $destinationRefs, string $errorCode, CarbonImmutable $now): TravelMatrixSnapshot
    {
        return DB::transaction(function () use ($request, $signature, $originRefs, $destinationRefs, $errorCode, $now): TravelMatrixSnapshot {
            $snapshot = $this->createSnapshot($request, $signature, 'straight_line_estimate', null, null, $errorCode, $originRefs, $destinationRefs, $now, null);
            foreach ($request->origins as $oi => $origin) {
                foreach ($request->destinations as $di => $destination) {
                    $this->createElement($snapshot, $origin, $destination, $oi, $di, $originRefs[$oi] ?? [], $destinationRefs[$di] ?? [], null, null, null, null, 'ESTIMATE_ONLY', 'straight_line_estimate');
                }
            }
            return $snapshot->load('elements');
        });
    }

    private function createSnapshot(RouteMatrixRequest $request, string $signature, string $basis, ?string $provider, ?string $sourceSnapshotId, ?string $errorCode, array $originRefs, array $destinationRefs, CarbonImmutable $calculatedAt, ?CarbonImmutable $staleAt): TravelMatrixSnapshot
    {
        return TravelMatrixSnapshot::query()->create([
            'company_id'=>$this->context->companyId(),'branch_id'=>$this->context->branchId(),'workspace_id'=>$this->context->workspaceId(),
            'request_signature'=>$signature,'travel_mode'=>$request->travelMode,'routing_preference'=>$request->routingPreference,
            'provider'=>$provider,'result_basis'=>$basis,'source_snapshot_id'=>$sourceSnapshotId,
            'origin_count'=>count($request->origins),'destination_count'=>count($request->destinations),'element_count'=>$request->elementCount(),
            'origins'=>$this->pointMetadata($request->origins,$originRefs),'destinations'=>$this->pointMetadata($request->destinations,$destinationRefs),
            'provider_error_code'=>$errorCode,'metadata'=>['configuration_version'=>$this->configuration->version()],
            'calculated_at'=>$calculatedAt,'stale_at'=>$staleAt,'created_by_user_id'=>$this->context->userId(),
        ]);
    }

    private function createElement(TravelMatrixSnapshot $snapshot, Coordinates $origin, Coordinates $destination, int $oi, int $di, array $originRef, array $destinationRef, ?int $distanceMetres, ?int $durationSeconds, ?int $staticDurationSeconds, ?int $trafficDelaySeconds, string $condition, string $basis): void
    {
        $straight = (int) round($this->distance->kilometres($origin->latitude,$origin->longitude,$destination->latitude,$destination->longitude) * 1000);
        TravelMatrixElement::query()->create([
            'company_id'=>$this->context->companyId(),'matrix_snapshot_id'=>(string)$snapshot->id,
            'origin_index'=>$oi,'destination_index'=>$di,
            'origin_reference_type'=>$originRef['reference_type'] ?? null,'origin_public_reference_id'=>$originRef['public_reference_id'] ?? null,
            'destination_reference_type'=>$destinationRef['reference_type'] ?? null,'destination_public_reference_id'=>$destinationRef['public_reference_id'] ?? null,
            'origin_latitude'=>$origin->latitude,'origin_longitude'=>$origin->longitude,'destination_latitude'=>$destination->latitude,'destination_longitude'=>$destination->longitude,
            'distance_metres'=>$distanceMetres,'straight_line_distance_metres'=>$straight,'duration_seconds'=>$durationSeconds,'static_duration_seconds'=>$staticDurationSeconds,'traffic_delay_seconds'=>$trafficDelaySeconds,
            'condition'=>$condition,'metadata'=>['basis'=>$basis,'origin_label'=>$originRef['label'] ?? null,'destination_label'=>$destinationRef['label'] ?? null],
        ]);
    }

    /** @param array<int,Coordinates> $points */
    private function pointMetadata(array $points, array $refs): array
    {
        return array_map(static fn (Coordinates $point, int $index): array => array_filter([
            'lat'=>$point->latitude,'lng'=>$point->longitude,
            'reference_type'=>$refs[$index]['reference_type'] ?? null,'public_reference_id'=>$refs[$index]['public_reference_id'] ?? null,'label'=>$refs[$index]['label'] ?? null,
        ], static fn ($v): bool => $v !== null && $v !== ''), $points, array_keys($points));
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialSignalPublisher;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixRequest;
use App\Extensions\TitanMapsIntelligence\DTO\RoutePlanStopInput;
use App\Extensions\TitanMapsIntelligence\DTO\RouteRequest;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Models\MapLocation;
use App\Extensions\TitanMapsIntelligence\Models\RoutePlan;
use App\Extensions\TitanMapsIntelligence\Models\RoutePlanRun;
use App\Extensions\TitanMapsIntelligence\Models\RoutePlanStop;
use App\Extensions\TitanMapsIntelligence\Models\TravelMatrixSnapshot;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

final class RoutePlanService
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly TravelMatrixService $matrices,
        private readonly RoutePlanOptimiser $optimiser,
        private readonly RouteCalculationService $routes,
        private readonly MapsConfiguration $configuration,
        private readonly SpatialSignalPublisher $signals,
        private readonly SpatialExecutionContextStore $executionContexts,
        private readonly SpatialExecutionContextFactory $contextFactory,
    ) {}

    /** @param array<string,mixed> $input */
    public function create(array $input): RoutePlan
    {
        $stops = array_values((array)($input['stops'] ?? []));
        $this->assertStopCount(count($stops), (string)($input['routing_preference'] ?? 'TRAFFIC_AWARE'), (string)($input['travel_mode'] ?? 'DRIVE'));
        $companyId = $this->context->companyId();
        /** @var RoutePlan $plan */
        $plan = DB::transaction(function () use ($input,$stops,$companyId): RoutePlan {
            $plan = RoutePlan::query()->create([
                'company_id'=>$companyId,'branch_id'=>$this->context->branchId(),'workspace_id'=>$this->context->workspaceId(),
                'name'=>(string)$input['name'],'service_date'=>$input['service_date'] ?? null,'worker_public_id'=>$input['worker_public_id'] ?? null,
                'travel_mode'=>(string)($input['travel_mode'] ?? 'DRIVE'),'routing_preference'=>(string)($input['routing_preference'] ?? 'TRAFFIC_AWARE'),
                'start_at'=>$input['start_at'] ?? CarbonImmutable::now('UTC'),'status'=>'active','created_by_user_id'=>$this->context->userId(),
                'updated_by_user_id'=>$this->context->userId(),'metadata'=>['configuration_version'=>$this->configuration->version()],
            ]);
            foreach ($stops as $index => $row) {
                $this->assertWindow((array)$row);
                $resolved = $this->resolveStopCoordinates((array)$row);
                RoutePlanStop::query()->create([
                    'company_id'=>$companyId,'route_plan_id'=>(string)$plan->id,'sequence'=>$index,'original_sequence'=>$index,
                    'stop_type'=>(string)($row['stop_type'] ?? 'custom'),'label'=>(string)($row['label'] ?? ('Stop '.($index+1))),
                    'reference_type'=>$row['reference_type'] ?? null,'public_reference_id'=>$row['public_reference_id'] ?? null,
                    'latitude'=>$resolved->latitude,'longitude'=>$resolved->longitude,'service_duration_seconds'=>(int)($row['service_duration_seconds'] ?? 0),
                    'window_start'=>$row['window_start'] ?? null,'window_end'=>$row['window_end'] ?? null,
                    'locked'=>$index === 0 ? true : (bool)($row['locked'] ?? false),'status'=>'planned',
                    'metadata'=>['emergency'=>(bool)($row['emergency'] ?? false)],
                ]);
            }
            return $plan;
        });
        $this->optimise($plan, 'initial', (bool)($input['render_geometry'] ?? false));
        return $plan->fresh(['stops','runs','currentRun']) ?? $plan;
    }

    public function optimise(RoutePlan $plan, string $trigger = 'manual', bool $renderGeometry = false): RoutePlanRun
    {
        $this->assertPlanCompany($plan);
        $stops = $this->activeStopsWithAnchor($plan);
        $this->assertStopCount(count($stops), (string)$plan->routing_preference, (string)$plan->travel_mode);
        $startAt = in_array($trigger,['initial','manual'],true) && $plan->start_at !== null
            ? $plan->start_at->toAtomString()
            : CarbonImmutable::now('UTC')->toAtomString();

        $dto = [];
        foreach ($stops as $index => $stop) {
            $dto[] = new RoutePlanStopInput(
                id:(string)$stop->id,stopType:(string)$stop->stop_type,label:(string)$stop->label,
                coordinates:new Coordinates((float)$stop->latitude,(float)$stop->longitude),
                serviceDurationSeconds:(int)$stop->service_duration_seconds,
                windowStart:$stop->window_start?->toAtomString(),windowEnd:$stop->window_end?->toAtomString(),
                locked:$index === 0 ? true : (bool)$stop->locked,originalSequence:$index,
                referenceType:$stop->reference_type,publicReferenceId:$stop->public_reference_id,
                metadata:(array)($stop->metadata ?? []),
            );
        }
        $points = array_map(static fn(RoutePlanStopInput $stop): Coordinates => $stop->coordinates,$dto);
        $refs = array_map(static fn(RoutePlanStopInput $stop): array => [
            'reference_type'=>$stop->referenceType,'public_reference_id'=>$stop->publicReferenceId,'label'=>$stop->label,
        ],$dto);
        $matrixResult = $this->matrices->calculate(new RouteMatrixRequest(
            $points,$points,(string)$plan->travel_mode,(string)$plan->routing_preference,$startAt,
        ),$refs,$refs);
        /** @var TravelMatrixSnapshot $snapshot */
        $snapshot = $matrixResult['snapshot'];
        $matrix = [];
        foreach ($snapshot->elements as $element) {
            if ($element->duration_seconds === null || $element->distance_metres === null) continue;
            $matrix[(int)$element->origin_index.':'.(int)$element->destination_index] = [
                'duration'=>(int)$element->duration_seconds,'distance'=>(int)$element->distance_metres,
            ];
        }
        $optimised = $this->optimiser->optimise($dto,$matrix,$startAt,$this->configuration->routePlanOptimisationTimeoutSeconds(),$this->configuration->routePlanExactOptimisationMaxStops());

        $completedCount = RoutePlanStop::query()->forCompany($this->context->companyId())->where('route_plan_id',$plan->id)->where('status','completed')->count();
        DB::transaction(function () use ($optimised,$completedCount): void {
            $sequence = $completedCount;
            foreach ($optimised->orderedStops as $position => $input) {
                $stop = RoutePlanStop::query()->forCompany($this->context->companyId())->whereKey($input->id)->first();
                if ($stop === null || $stop->status !== 'planned') continue;
                $stop->sequence = $sequence++;
                $stop->save();
            }
        });

        [$geometryStatus,$routeSnapshotIds] = $this->renderGeometry($optimised->orderedStops,$plan,$renderGeometry);
        $hasEta = $snapshot->result_basis !== 'straight_line_estimate';
        $revision = ((int)RoutePlanRun::query()->forCompany($this->context->companyId())->where('route_plan_id',$plan->id)->max('revision')) + 1;
        $run = RoutePlanRun::query()->create([
            'company_id'=>$this->context->companyId(),'route_plan_id'=>(string)$plan->id,'revision'=>$revision,'trigger'=>$trigger,
            'matrix_snapshot_id'=>(string)$snapshot->id,'result_basis'=>(string)$snapshot->result_basis,'provider'=>$snapshot->provider,
            'algorithm'=>$optimised->algorithm,'baseline_distance_metres'=>$optimised->baselineDistanceMetres,
            'optimised_distance_metres'=>$optimised->optimisedDistanceMetres,'distance_savings_metres'=>$optimised->distanceSavingsMetres,
            'baseline_duration_seconds'=>$hasEta ? $optimised->baselineDurationSeconds : null,
            'optimised_duration_seconds'=>$hasEta ? $optimised->optimisedDurationSeconds : null,
            'duration_savings_seconds'=>$hasEta ? $optimised->durationSavingsSeconds : null,
            'ordered_stop_ids'=>array_map(static fn(RoutePlanStopInput $s): string => $s->id,$optimised->orderedStops),
            'schedule'=>$optimised->schedule,'window_violations'=>$optimised->windowViolations,'route_snapshot_ids'=>$routeSnapshotIds,
            'geometry_status'=>$geometryStatus,'metadata'=>['cache_status'=>$matrixResult['cache_status'],'configuration_version'=>$this->configuration->version(),'heuristic_used'=>$optimised->heuristicUsed,'timed_out'=>$optimised->timedOut,'elapsed_milliseconds'=>$optimised->elapsedMilliseconds],
            'calculated_at'=>CarbonImmutable::now('UTC'),'created_by_user_id'=>$this->context->userId(),
        ]);
        if($optimised->heuristicUsed){$ctx=$this->executionContexts->current() ?? $this->contextFactory->fromInput('route.optimisation',['execution_origin'=>'system']);$this->signals->publish('maps.route.optimisation.heuristic_used',$ctx,['route_plan_id'=>(string)$plan->id,'route_plan_run_id'=>(string)$run->id,'stop_count'=>count($optimised->orderedStops),'algorithm'=>$optimised->algorithm,'timed_out'=>$optimised->timedOut,'elapsed_milliseconds'=>$optimised->elapsedMilliseconds]);}
                $plan->current_run_id = (string)$run->id;
        $plan->updated_by_user_id = $this->context->userId();
        $plan->save();
        return $run->fresh() ?? $run;
    }

    /** @param array<string,mixed> $input */
    public function insertEmergencyStop(RoutePlan $plan, array $input, bool $renderGeometry = false): RoutePlanRun
    {
        $this->assertPlanCompany($plan);
        $currentCount = RoutePlanStop::query()->forCompany($this->context->companyId())->where('route_plan_id',$plan->id)->where('status','planned')->count();
        if ($currentCount + 1 > $this->configuration->routePlanMaximumStops()) {
            throw MapsIntelligenceException::fromCode('MAPS_ROUTE_PLAN_LIMIT_EXCEEDED','The emergency stop would exceed the configured route-plan stop limit.');
        }
        $this->assertWindow($input);
        $resolved = $this->resolveStopCoordinates($input);
        $maxSequence = (int)RoutePlanStop::query()->forCompany($this->context->companyId())->where('route_plan_id',$plan->id)->max('sequence');
        $maxOriginal = (int)RoutePlanStop::query()->forCompany($this->context->companyId())->where('route_plan_id',$plan->id)->max('original_sequence');
        RoutePlanStop::query()->create([
            'company_id'=>$this->context->companyId(),'route_plan_id'=>(string)$plan->id,'sequence'=>$maxSequence+1,'original_sequence'=>$maxOriginal+1,
            'stop_type'=>(string)($input['stop_type'] ?? 'job'),'label'=>(string)($input['label'] ?? 'Emergency stop'),
            'reference_type'=>$input['reference_type'] ?? null,'public_reference_id'=>$input['public_reference_id'] ?? null,
            'latitude'=>$resolved->latitude,'longitude'=>$resolved->longitude,'service_duration_seconds'=>(int)($input['service_duration_seconds'] ?? 0),
            'window_start'=>$input['window_start'] ?? null,'window_end'=>$input['window_end'] ?? null,'locked'=>(bool)($input['locked'] ?? false),
            'status'=>'planned','metadata'=>['emergency'=>true,'inserted_at'=>CarbonImmutable::now('UTC')->toAtomString()],
        ]);
        return $this->optimise($plan,'emergency_insert',$renderGeometry);
    }

    public function setStopStatus(RoutePlan $plan, RoutePlanStop $stop, string $status, bool $renderGeometry = false): ?RoutePlanRun
    {
        $this->assertPlanCompany($plan);
        if ($stop->company_id !== $this->context->companyId() || $stop->route_plan_id !== $plan->id) {
            throw MapsIntelligenceException::fromCode('MAPS_TENANT_DENIED','The route-plan stop is not available in this company.');
        }
        if (!in_array($status,['planned','completed','cancelled'],true)) {
            throw MapsIntelligenceException::fromCode('MAPS_ROUTE_PLAN_STATUS_INVALID','Unsupported route-plan stop status.');
        }
        $stop->status=$status;
        $stop->completed_at=$status === 'completed' ? CarbonImmutable::now('UTC') : null;
        $stop->save();
        $planned = RoutePlanStop::query()->forCompany($this->context->companyId())->where('route_plan_id',$plan->id)->where('status','planned')->count();
        if ($planned === 0) {
            $plan->status='completed'; $plan->updated_by_user_id=$this->context->userId(); $plan->save();
            return null;
        }
        $active = $this->activeStopsWithAnchor($plan);
        if (count($active) < 2) return null;
        return $this->optimise($plan,$status === 'completed' ? 'stop_completed' : ($status === 'cancelled' ? 'stop_cancelled' : 'stop_reopened'),$renderGeometry);
    }

    /** @return array<int,RoutePlanStop> */
    private function activeStopsWithAnchor(RoutePlan $plan): array
    {
        $query = RoutePlanStop::query()->forCompany($this->context->companyId())->where('route_plan_id',$plan->id);
        $planned = (clone $query)->where('status','planned')->orderBy('sequence')->get()->all();
        $lastCompleted = (clone $query)->where('status','completed')->latest('completed_at')->first();
        if ($lastCompleted !== null) array_unshift($planned,$lastCompleted);
        return $planned;
    }

    private function assertWindow(array $row): void
    {
        $start=$row['window_start']??null; $end=$row['window_end']??null;
        if(($start===null || $start==='') xor ($end===null || $end==='')){
            throw MapsIntelligenceException::fromCode('MAPS_ROUTE_PLAN_WINDOW_INVALID','Appointment windows require both a start and an end.');
        }
        if($start!==null && $start!=='' && (strtotime((string)$start)===false || strtotime((string)$end)===false || strtotime((string)$end) < strtotime((string)$start))){
            throw MapsIntelligenceException::fromCode('MAPS_ROUTE_PLAN_WINDOW_INVALID','Appointment window end must not precede its start.');
        }
    }

    private function resolveStopCoordinates(array $row): Coordinates
    {
        $referenceType = isset($row['reference_type']) ? trim((string)$row['reference_type']) : '';
        $publicId = isset($row['public_reference_id']) ? trim((string)$row['public_reference_id']) : '';
        if (($referenceType === '') xor ($publicId === '')) {
            throw MapsIntelligenceException::fromCode('MAPS_REFERENCE_INVALID','Route-plan references require both reference type and public id.');
        }
        if ($referenceType !== '') {
            if (!in_array($referenceType,['job','property','branch','supplier','contractor'],true)) {
                throw MapsIntelligenceException::fromCode('MAPS_REFERENCE_INVALID','Unsupported route-plan reference type.');
            }
            $location = MapLocation::query()->forCompany($this->context->companyId())
                ->where('reference_type',$referenceType)->where('public_reference_id',$publicId)->first();
            if ($location === null || $location->latitude === null || $location->longitude === null) {
                throw MapsIntelligenceException::fromCode('MAPS_REFERENCE_NOT_FOUND','The referenced Titan record does not have an authorised canonical map location.');
            }
            return new Coordinates((float)$location->latitude,(float)$location->longitude);
        }
        if (!array_key_exists('latitude',$row) || !array_key_exists('longitude',$row) || !is_numeric($row['latitude']) || !is_numeric($row['longitude'])) {
            throw MapsIntelligenceException::fromCode('MAPS_ROUTE_PLAN_COORDINATES_REQUIRED','A custom route stop requires latitude and longitude.');
        }
        $lat=(float)$row['latitude']; $lng=(float)$row['longitude'];
        if($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180){
            throw MapsIntelligenceException::fromCode('MAPS_ROUTE_PLAN_COORDINATES_INVALID','Route stop coordinates are outside valid latitude/longitude ranges.');
        }
        return new Coordinates($lat,$lng);
    }

    /** @param array<int,RoutePlanStopInput> $stops @return array{0:string,1:array<int,string>} */
    private function renderGeometry(array $stops, RoutePlan $plan, bool $renderGeometry): array
    {
        if (!$renderGeometry) return ['sequence_connectors',[]];
        $segments = max(0,count($stops)-1);
        if ($segments > $this->configuration->routePlanMaximumGeometrySegments()) return ['omitted_segment_limit',[]];
        $ids=[]; $basis=[];
        for ($i=1;$i<count($stops);$i++) {
            $result=$this->routes->calculate(new RouteRequest(
                $stops[$i-1]->coordinates,$stops[$i]->coordinates,(string)$plan->travel_mode,(string)$plan->routing_preference,null,null,
                workerPublicId:$plan->worker_public_id,
                originReferenceType:$stops[$i-1]->referenceType,originPublicReferenceId:$stops[$i-1]->publicReferenceId,
                destinationReferenceType:$stops[$i]->referenceType,destinationPublicReferenceId:$stops[$i]->publicReferenceId,
            ));
            $ids[]=$result->routeSnapshotId;
            $basis[]=$result->basis;
        }
        $status = in_array('straight_line_estimate',$basis,true) ? 'mixed_or_estimate_geometry'
            : (in_array('last_valid_snapshot',$basis,true) ? 'stale_provider_geometry' : 'provider_road_geometry');
        return [$status,$ids];
    }

    private function assertStopCount(int $count, string $routingPreference, string $travelMode = 'DRIVE'): void
    {
        if ($count < 2 || $count > $this->configuration->routePlanMaximumStops()) {
            throw MapsIntelligenceException::fromCode('MAPS_ROUTE_PLAN_LIMIT_EXCEEDED',sprintf('Route plans require between 2 and %d active stops.',$this->configuration->routePlanMaximumStops()));
        }
        $this->configuration->assertMatrixLimits($count,$count,$routingPreference,$travelMode);
    }

    private function assertPlanCompany(RoutePlan $plan): void
    {
        if (!hash_equals($this->context->companyId(),(string)$plan->company_id)) {
            throw MapsIntelligenceException::fromCode('MAPS_TENANT_DENIED','The route plan is not available in this company.');
        }
    }
}

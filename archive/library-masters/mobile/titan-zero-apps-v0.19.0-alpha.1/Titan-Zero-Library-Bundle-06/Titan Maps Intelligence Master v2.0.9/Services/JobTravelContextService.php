<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\FieldReferenceGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialKnowledgeGateway;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\RouteRequest;
use App\Extensions\TitanMapsIntelligence\DTO\SpatialExecutionContext;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;

final class JobTravelContextService
{
    public function __construct(
        private readonly AuthorisedCompanyContext $company,
        private readonly FieldReferenceGateway $references,
        private readonly MapLocationService $locations,
        private readonly ServiceTerritoryService $territories,
        private readonly RouteCalculationService $routes,
        private readonly RouteResultPresenter $routePresenter,
        private readonly SpatialKnowledgeGateway $knowledge,
    ) {}

    public function context(string $jobPublicId, ?string $branchPublicId, ?string $serviceKey, SpatialExecutionContext $execution): array
    {
        $companyId=$this->company->companyId();
        $reference=$this->references->resolve($companyId,'job',$jobPublicId);
        if($reference===null || !hash_equals($companyId,$reference->companyId)) {
            throw MapsIntelligenceException::fromCode('MAPS_JOB_REFERENCE_NOT_FOUND','The requested job reference does not exist in the authorised company.',['job_public_id'=>$jobPublicId]);
        }
        $jobLocation=$this->locations->resolve('job',$jobPublicId);
        $target=[
            'target_reference_type'=>'job','target_public_reference_id'=>$jobPublicId,
            'latitude'=>(float)$jobLocation->latitude,'longitude'=>(float)$jobLocation->longitude,
            'service_key'=>$serviceKey,
        ];
        $evaluation=$this->territories->evaluate(array_filter($target,static fn($v): bool=>$v!==null&&$v!==''));
        $resolvedBranch=$branchPublicId ?: ($evaluation->branch_public_id ?: $reference->branchId);
        $route=null;
        if(is_string($resolvedBranch) && trim($resolvedBranch)!=='') {
            $branchLocation=$this->locations->resolve('branch',$resolvedBranch);
            $origin=new Coordinates((float)$branchLocation->latitude,(float)$branchLocation->longitude);
            $destination=new Coordinates((float)$jobLocation->latitude,(float)$jobLocation->longitude);
            $route=$this->routePresenter->present($this->routes->calculate(new RouteRequest($origin,$destination,'DRIVE','TRAFFIC_AWARE')),$origin,$destination);
        }
        $knowledge=$this->knowledge->resolveJurisdiction($execution,[
            'latitude'=>(float)$jobLocation->latitude,'longitude'=>(float)$jobLocation->longitude,
        ],array_filter(['service_key'=>$serviceKey,'reference_type'=>'job'],static fn($v): bool=>$v!==null&&$v!==''));
        return [
            'job_reference'=>['public_reference_id'=>$jobPublicId,'branch_public_id'=>$reference->branchId],
            'location'=>[
                'map_location_id'=>(string)$jobLocation->id,'latitude'=>(float)$jobLocation->latitude,'longitude'=>(float)$jobLocation->longitude,
                'source'=>(string)$jobLocation->source,'precision'=>$jobLocation->precision,'provider'=>$jobLocation->provider,
            ],
            'service_area'=>[
                'evaluation_id'=>(string)$evaluation->id,'covered'=>(bool)$evaluation->covered,'primary_territory_id'=>$evaluation->primary_territory_id,
                'blocked_territory_id'=>$evaluation->blocked_territory_id,'branch_public_id'=>$evaluation->branch_public_id,
                'road_distance_metres'=>$evaluation->road_distance_metres,'duration_seconds'=>$evaluation->duration_seconds,
                'distance_basis'=>$evaluation->distance_basis,'eta_basis'=>$evaluation->eta_basis,
                'signals'=>$evaluation->signals->map(static fn($signal): array=>[
                    'signal_type'=>$signal->signal_type,'severity'=>$signal->severity,'authoritative'=>(bool)$signal->authoritative,
                    'application_status'=>$signal->application_status,'hint_type'=>$signal->hint_type,'hint_value'=>$signal->hint_value,'currency'=>$signal->currency,
                ])->all(),
            ],
            'route_context'=>$route,
            'knowledge_context'=>$knowledge,
            'authoritative_source'=>'Titan Field when active; legacy host reference adapter otherwise; Maps stores only geographic projection/evidence',
        ];
    }
}

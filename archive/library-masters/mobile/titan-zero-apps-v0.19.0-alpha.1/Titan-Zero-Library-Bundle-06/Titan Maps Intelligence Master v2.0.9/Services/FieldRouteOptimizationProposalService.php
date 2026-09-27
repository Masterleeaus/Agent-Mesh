<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixRequest;
use App\Extensions\TitanMapsIntelligence\DTO\RoutePlanStopInput;
use App\Extensions\TitanMapsIntelligence\Models\FieldRouteOptimizationProposal;
use Carbon\CarbonImmutable;
use InvalidArgumentException;

/**
 * Read-only optimiser peer for Titan Field.
 * It records spatial proposal evidence only: read_only=true, no_field_write=true.
 */
final class FieldRouteOptimizationProposalService
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly TravelMatrixService $matrices,
        private readonly RoutePlanOptimiser $optimiser,
        private readonly MapsConfiguration $configuration,
    ) {}

    /** @return array<string,mixed> */
    public function propose(string $fieldRoutePublicId, array $route, array $stops, array $context = []): array
    {
        $fieldRoutePublicId=trim($fieldRoutePublicId);
        if($fieldRoutePublicId===''||count($stops)<2) throw new InvalidArgumentException('Field route optimisation requires a route and at least two stops.');
        if(count($stops)>50) throw new InvalidArgumentException('Field route optimisation is limited to 50 stops per proposal.');

        $inputs=[];$coordinates=[];$refs=[];$baseline=[];$locked=[];
        foreach(array_values($stops) as $index=>$stop){
            if(!is_array($stop))throw new InvalidArgumentException('Route stop payload is invalid.');
            $id=trim((string)($stop['public_id']??$stop['id']??''));
            if($id==='')throw new InvalidArgumentException('Every route stop requires a public id.');
            if(!isset($stop['latitude'],$stop['longitude'])||!is_numeric($stop['latitude'])||!is_numeric($stop['longitude']))throw new InvalidArgumentException("Route stop {$id} is not geocoded.");
            $coord=new Coordinates((float)$stop['latitude'],(float)$stop['longitude']);
            $windowStart=isset($stop['window_start'])&&trim((string)$stop['window_start'])!==''?(string)$stop['window_start']:null;
            $windowEnd=isset($stop['window_end'])&&trim((string)$stop['window_end'])!==''?(string)$stop['window_end']:null;
            $isLocked=(bool)($stop['locked']??false);
            if($isLocked)$locked[]=$id;
            $input=new RoutePlanStopInput(
                id:$id, stopType:'job', label:(string)($stop['label']??('Stop '.($index+1))), coordinates:$coord,
                serviceDurationSeconds:max(0,(int)($stop['service_duration_seconds']??0)), windowStart:$windowStart, windowEnd:$windowEnd,
                locked:$isLocked, originalSequence:$index+1, referenceType:'job', publicReferenceId:isset($stop['work_order_public_id'])?(string)$stop['work_order_public_id']:null,
                metadata:['field_route_public_id'=>$fieldRoutePublicId,'location_public_id'=>$stop['location_public_id']??null,'appointment_public_id'=>$stop['appointment_public_id']??null],
            );
            $inputs[]=$input;$coordinates[]=$coord;$baseline[]=$id;$refs[]=['reference_type'=>'job','public_reference_id'=>$stop['work_order_public_id']??$id,'label'=>$input->label];
        }
        $startAt=(string)($route['start_at']??$route['started_at']??$context['start_at']??CarbonImmutable::now('UTC')->toAtomString());
        $travelMode=(string)($context['travel_mode']??'DRIVE');$routingPreference=(string)($context['routing_preference']??'TRAFFIC_AWARE');
        $matrixResult=$this->matrices->calculate(new RouteMatrixRequest($coordinates,$coordinates,$travelMode,$routingPreference,$startAt),$refs,$refs);
        $snapshot=$matrixResult['snapshot'];$matrix=[];
        foreach($snapshot->elements as $element){
            if($element->duration_seconds===null||$element->distance_metres===null)continue;
            $from=$inputs[(int)$element->origin_index]??null;$to=$inputs[(int)$element->destination_index]??null;
            if(!$from||!$to)continue;$matrix[$from->originalSequence.':'.$to->originalSequence]=['duration'=>(int)$element->duration_seconds,'distance'=>(int)$element->distance_metres];
        }
        $optimised=$this->optimiser->optimise($inputs,$matrix,$startAt,$this->configuration->routePlanOptimisationTimeoutSeconds(),$this->configuration->routePlanExactOptimisationMaxStops());
        $proposed=array_map(static fn(RoutePlanStopInput $s):string=>$s->id,$optimised->orderedStops);
        $inputData=['field_route_public_id'=>$fieldRoutePublicId,'route'=>$route,'stops'=>array_map(static fn(RoutePlanStopInput $s):array=>$s->toArray(),$inputs),'travel_mode'=>$travelMode,'routing_preference'=>$routingPreference,'matrix_signature'=>$snapshot->request_signature];
        $inputHash=hash('sha256',json_encode($inputData,JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR));
        $proposalData=['baseline_stop_public_ids'=>$baseline,'proposed_stop_public_ids'=>$proposed,'algorithm'=>$optimised->algorithm,'baseline_distance_metres'=>$optimised->baselineDistanceMetres,'optimised_distance_metres'=>$optimised->optimisedDistanceMetres,'distance_savings_metres'=>$optimised->distanceSavingsMetres,'baseline_duration_seconds'=>$optimised->baselineDurationSeconds,'optimised_duration_seconds'=>$optimised->optimisedDurationSeconds,'duration_savings_seconds'=>$optimised->durationSavingsSeconds,'schedule'=>$optimised->schedule,'window_violations'=>$optimised->windowViolations];
        $proposalHash=hash('sha256',json_encode($proposalData,JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR));
        $warnings=[];if($optimised->heuristicUsed)$warnings[]='heuristic_used';if($optimised->timedOut)$warnings[]='optimiser_timed_out_best_found_returned';if($optimised->windowViolations!==[])$warnings[]='appointment_window_violations';if((string)$snapshot->result_basis==='straight_line_estimate')$warnings[]='provider_matrix_unavailable_straight_line_estimate_used';
        $constraints=['locked_stop_public_ids'=>$locked,'first_stop_fixed'=>true,'appointment_windows_enforced'=>true,'field_governance_required'=>true,'no_field_write'=>true];
        $provenance=['matrix_snapshot_id'=>(string)$snapshot->id,'matrix_basis'=>(string)$snapshot->result_basis,'matrix_provider'=>$snapshot->provider,'cache_status'=>$matrixResult['cache_status'],'configuration_version'=>$this->configuration->version(),'read_only'=>true,'no_field_write'=>true];
        $expires=CarbonImmutable::now('UTC')->addMinutes(max(1,min(120,(int)($context['expires_in_minutes']??15))));
        $record=FieldRouteOptimizationProposal::query()->firstOrCreate(
            ['company_id'=>$this->context->companyId(),'input_hash'=>$inputHash,'proposal_hash'=>$proposalHash],
            ['field_route_public_id'=>$fieldRoutePublicId,'baseline_stop_public_ids'=>$baseline,'proposed_stop_public_ids'=>$proposed,'algorithm'=>$optimised->algorithm,'baseline_distance_metres'=>$optimised->baselineDistanceMetres,'optimised_distance_metres'=>$optimised->optimisedDistanceMetres,'distance_savings_metres'=>$optimised->distanceSavingsMetres,'baseline_duration_seconds'=>$optimised->baselineDurationSeconds,'optimised_duration_seconds'=>$optimised->optimisedDurationSeconds,'duration_savings_seconds'=>$optimised->durationSavingsSeconds,'schedule'=>$optimised->schedule,'window_violations'=>$optimised->windowViolations,'constraints'=>$constraints,'provenance'=>$provenance,'warnings'=>$warnings,'expires_at'=>$expires,'created_by_user_id'=>$this->context->userId()]
        );
        return ['schema'=>'titan.maps.field-route-optimisation-proposal.v1','available'=>true,'provider'=>'titan-maps-intelligence','read_only'=>true,'no_field_write'=>true,'proposal_id'=>(string)$record->id,'field_route_public_id'=>$fieldRoutePublicId,'input_hash'=>$inputHash,'proposal_hash'=>$proposalHash]+$proposalData+['constraints'=>$constraints,'provenance'=>$provenance,'warnings'=>$warnings,'expires_at'=>$record->expires_at?->toAtomString()];
    }
}

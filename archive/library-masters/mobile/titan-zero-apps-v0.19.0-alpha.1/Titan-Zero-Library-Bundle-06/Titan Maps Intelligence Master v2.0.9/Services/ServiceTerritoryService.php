<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Contracts\GeographicPricingSignalProvider;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialSignalPublisher;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\RouteRequest;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Models\GeographicPricingSignal;
use App\Extensions\TitanMapsIntelligence\Models\MapLocation;
use App\Extensions\TitanMapsIntelligence\Models\ServiceTerritory;
use App\Extensions\TitanMapsIntelligence\Models\TerritoryEvaluation;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

final class ServiceTerritoryService implements GeographicPricingSignalProvider
{
    private const EFFECTS = ['include','exclude'];
    private const STATUSES = ['active','paused','archived'];
    private const MATCH_MODES = ['circle','polygon','postcode','suburb','road_distance','drive_time'];

    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly PermissionAuthorizer $authorizer,
        private readonly ServiceTerritoryMatcher $matcher,
        private readonly RouteCalculationService $routes,
        private readonly GeographicPricingSignalBuilder $signals,
        private readonly TravelZoneRuleEvaluator $travelZones,
        private readonly TerritoryConflictService $conflicts,
        private readonly SpatialSignalPublisher $spatialSignals,
        private readonly SpatialExecutionContextStore $executionContexts,
        private readonly SpatialExecutionContextFactory $contextFactory,
    ) {}

    public function create(array $input): ServiceTerritory
    {
        $companyId = $this->context->companyId();
        $userId = $this->context->userId();
        $this->authorizer->authorize($userId, $companyId, 'titan-maps-intelligence.territory.manage');
        $data = $this->validateDefinition($input, $companyId);
        return ServiceTerritory::query()->create($data + [
            'company_id'=>$companyId,
            'branch_id'=>$this->context->branchId(),
            'workspace_id'=>$this->context->workspaceId(),
            'created_by_user_id'=>$userId,
            'updated_by_user_id'=>$userId,
            'metadata'=>['configuration_version'=>'pass14'],
        ]);
    }

    public function update(ServiceTerritory $territory, array $input): ServiceTerritory
    {
        $companyId=$this->context->companyId();
        $this->authorizer->authorize($this->context->userId(),$companyId,'titan-maps-intelligence.territory.manage');
        if (!hash_equals($companyId,(string)$territory->company_id)) throw MapsIntelligenceException::fromCode('MAPS_TENANT_DENIED','Territory belongs to another company.');
        $data=$this->validateDefinition(array_merge($territory->toArray(),$input),$companyId);
        $territory->fill($data + ['updated_by_user_id'=>$this->context->userId()])->save();
        return $territory->refresh();
    }

    public function archive(ServiceTerritory $territory): ServiceTerritory
    {
        $companyId=$this->context->companyId();
        $this->authorizer->authorize($this->context->userId(),$companyId,'titan-maps-intelligence.territory.manage');
        if (!hash_equals($companyId,(string)$territory->company_id)) throw MapsIntelligenceException::fromCode('MAPS_TENANT_DENIED','Territory belongs to another company.');
        $territory->forceFill(['status'=>'archived','updated_by_user_id'=>$this->context->userId()])->save();
        return $territory->refresh();
    }

    public function evaluate(array $target): TerritoryEvaluation
    {
        $companyId=$this->context->companyId();
        $userId=$this->context->userId();
        $this->authorizer->authorize($userId,$companyId,'titan-maps-intelligence.territory.evaluate');
        $target=$this->validateTarget($target);
        $territories=$this->activeTerritories($companyId,(string)($target['service_key'] ?? ''));

        $matches=[]; $routeEvidence=[];
        foreach ($territories as $territory) {
            $data=$territory->toArray();
            $mode=(string)$territory->match_mode;
            if (in_array($mode,['circle','polygon','postcode','suburb'],true)) {
                $r=$this->matcher->matches($data,$target);
                if ($r->matched) $matches[]=$this->matchRow($territory,$r->basis,$r->distanceMetres,$r->durationSeconds,$r->evidence);
                continue;
            }
            if (!in_array($mode,['road_distance','drive_time'],true)) continue;
            if (!isset($target['latitude'],$target['longitude']) || !$territory->branch_public_id) continue;
            $branch=(string)$territory->branch_public_id;
            if (!isset($routeEvidence[$branch])) $routeEvidence[$branch]=$this->routeFromBranch($companyId,$branch,(float)$target['latitude'],(float)$target['longitude']);
            $e=$routeEvidence[$branch];
            if ($this->travelZones->matches($data,$e)) $matches[]=$this->matchRow($territory,$mode,$e['road_distance_metres'],$e['duration_seconds'],$e);
        }

        $primaryBranch = isset($target['primary_branch_public_id']) ? (string) $target['primary_branch_public_id'] : null;
        usort($matches, static function(array $a,array $b) use($primaryBranch,$routeEvidence): int {
            $priority = ($b['priority'] <=> $a['priority']); if ($priority !== 0) return $priority;
            $aPrimary = $primaryBranch !== null && ($a['branch_public_id'] ?? null) === $primaryBranch ? 1 : 0;
            $bPrimary = $primaryBranch !== null && ($b['branch_public_id'] ?? null) === $primaryBranch ? 1 : 0;
            if ($aPrimary !== $bPrimary) return $bPrimary <=> $aPrimary;
            $aDistance = isset($a['branch_public_id'], $routeEvidence[(string)$a['branch_public_id']]['road_distance_metres']) ? (float)$routeEvidence[(string)$a['branch_public_id']]['road_distance_metres'] : INF;
            $bDistance = isset($b['branch_public_id'], $routeEvidence[(string)$b['branch_public_id']]['road_distance_metres']) ? (float)$routeEvidence[(string)$b['branch_public_id']]['road_distance_metres'] : INF;
            if ($aDistance !== $bDistance) return $aDistance <=> $bDistance;
            return strcmp((string)$a['id'], (string)$b['id']);
        });
        $ruleChain = array_values(array_map(static fn(array $m): array => ['territory_id'=>$m['id'],'effect'=>$m['effect'],'priority'=>$m['priority'],'branch_public_id'=>$m['branch_public_id'],'basis'=>$m['basis']], $matches));
        $resolutionBasis = 'priority_then_primary_branch_then_nearest_branch_then_stable_id';
        $exclude=current(array_filter($matches,static fn(array $m): bool=>$m['effect']==='exclude')) ?: null;
        $include=current(array_filter($matches,static fn(array $m): bool=>$m['effect']==='include')) ?: null;
        $covered=$exclude===null && $include!==null;
        $primaryId=$covered ? ($include['id'] ?? null) : null;
        $primary=$primaryId ? $territories->firstWhere('id',$primaryId) : null;
        $travel=$include && in_array($include['match_mode'],['road_distance','drive_time'],true) ? $include : $this->bestTravelMatch($matches);
        $travelEvidence=$travel ? ($routeEvidence[(string)($travel['branch_public_id'] ?? '')] ?? []) : [];

        $evaluation=TerritoryEvaluation::query()->create([
            'company_id'=>$companyId,'branch_id'=>$this->context->branchId(),'workspace_id'=>$this->context->workspaceId(),
            'target_reference_type'=>$target['target_reference_type'] ?? null,'target_public_reference_id'=>$target['target_public_reference_id'] ?? null,
            'target_latitude'=>$target['latitude'] ?? null,'target_longitude'=>$target['longitude'] ?? null,'target_suburb'=>$target['suburb'] ?? null,'target_postcode'=>$target['postcode'] ?? null,'service_key'=>$target['service_key'] ?? null,
            'covered'=>$covered,'primary_territory_id'=>$primaryId,'blocked_territory_id'=>$exclude['id'] ?? null,'travel_territory_id'=>$travel['id'] ?? null,
            'branch_public_id'=>$include['branch_public_id'] ?? ($travel['branch_public_id'] ?? null),'route_snapshot_id'=>$travelEvidence['route_snapshot_id'] ?? null,
            'result_basis'=>$travelEvidence['basis'] ?? 'geographic_rules','road_distance_metres'=>$travelEvidence['road_distance_metres'] ?? null,
            'straight_line_distance_metres'=>$travelEvidence['straight_line_distance_metres'] ?? null,'duration_seconds'=>$travelEvidence['duration_seconds'] ?? null,
            'distance_basis'=>$travelEvidence['distance_basis'] ?? null,'eta_basis'=>$travelEvidence['eta_basis'] ?? null,'matched_territories'=>$matches,
            'evidence'=>['route_evidence'=>array_values($routeEvidence),'territory_count'=>$territories->count(),'matched_rule_chain'=>$ruleChain,'resolution_basis'=>$resolutionBasis],
            'evaluated_by_user_id'=>$userId,'evaluated_at'=>CarbonImmutable::now('UTC'),
        ]);

        $signalContext=$this->executionContexts->current() ?? $this->contextFactory->fromInput('service_area.check', []);
        $matchedIds=array_values(array_map(static fn(array $m): string=>(string)$m['id'],$matches));
        if($this->conflicts->conflicts($matches)!==[]) {
            $this->spatialSignals->publish('maps.territory.conflict',$signalContext,['evaluation_id'=>(string)$evaluation->id,'territory_ids'=>$matchedIds,'effects'=>array_values(array_unique(array_map(static fn(array $m): string=>(string)$m['effect'],$matches))),'service_key'=>$target['service_key']??null]);
        }
        if($exclude!==null) {
            $this->spatialSignals->publish('maps.service_area.excluded',$signalContext,['evaluation_id'=>(string)$evaluation->id,'blocked_territory_id'=>(string)$exclude['id'],'matched_territory_ids'=>$matchedIds,'service_key'=>$target['service_key']??null]);
        }

        $pricingTerritory = null;
        if ($covered) {
            foreach ($matches as $matched) {
                if (($matched['effect'] ?? null) !== 'include') continue;
                $candidate = $territories->firstWhere('id', $matched['id'] ?? null);
                if ($candidate && is_array($candidate->pricing_hint) && $candidate->pricing_hint !== []) { $pricingTerritory = $candidate; break; }
            }
        }
        $travelTerritory = $travel ? $territories->firstWhere('id', $travel['id'] ?? null) : null;
        $signalInput=[
            'covered'=>$covered,'primary_territory_id'=>$primaryId,'blocked_by'=>$exclude['id'] ?? null,'branch_public_id'=>$evaluation->branch_public_id,
            'road_distance_metres'=>$evaluation->road_distance_metres,'duration_seconds'=>$evaluation->duration_seconds,'distance_basis'=>$evaluation->distance_basis,'eta_basis'=>$evaluation->eta_basis,
            'travel_zone_id'=>$travel['id'] ?? null,'travel_match_mode'=>$travelTerritory?->match_mode,'travel_zone_name'=>$travelTerritory?->name,
            'pricing_hint'=>$pricingTerritory?->pricing_hint ? ((array)$pricingTerritory->pricing_hint + ['source_territory_id'=>(string)$pricingTerritory->id]) : null,
        ];
        foreach ($this->signals->build($signalInput) as $signal) {
            GeographicPricingSignal::query()->create([
                'company_id'=>$companyId,'territory_evaluation_id'=>(string)$evaluation->id,'service_territory_id'=>$signal['evidence']['source_territory_id'] ?? $primaryId,
                'signal_type'=>$signal['signal_type'],'severity'=>$signal['severity'] ?? 'info','authoritative'=>false,'application_status'=>'not_applied',
                'hint_type'=>$signal['hint_type'] ?? null,'hint_value'=>$signal['hint_value'] ?? null,'currency'=>$signal['currency'] ?? null,'evidence'=>$signal['evidence'] ?? [],'emitted_at'=>CarbonImmutable::now('UTC'),
            ]);
        }
        return $evaluation->load('signals');
    }

    private function activeTerritories(string $companyId,string $serviceKey): Collection
    {
        $now=CarbonImmutable::now('UTC');
        return ServiceTerritory::query()->forCompany($companyId)->where('status','active')->orderByDesc('priority')->get()->filter(function(ServiceTerritory $t) use($now,$serviceKey): bool {
            if ($t->effective_from && $t->effective_from->isAfter($now)) return false;
            if ($t->effective_until && $t->effective_until->isBefore($now)) return false;
            $keys=array_values(array_filter(array_map('strval',(array)($t->service_keys ?? []))));
            return $serviceKey==='' || $keys===[] || in_array($serviceKey,$keys,true);
        })->values();
    }

    private function routeFromBranch(string $companyId,string $branchPublicId,float $lat,float $lng): array
    {
        $branch=MapLocation::query()->forCompany($companyId)->where('reference_type','branch')->where('public_reference_id',$branchPublicId)->whereNotNull('latitude')->whereNotNull('longitude')->first();
        if (!$branch) throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_BRANCH_LOCATION_MISSING','Travel-zone branch has no company-scoped canonical location.',['branch_public_id'=>$branchPublicId]);
        $result=$this->routes->calculate(new RouteRequest(new Coordinates((float)$branch->latitude,(float)$branch->longitude),new Coordinates($lat,$lng),'DRIVE','TRAFFIC_AWARE'));
        return [
            'branch_public_id'=>$branchPublicId,'basis'=>$result->basis,'provider'=>$result->provider,'route_snapshot_id'=>$result->routeSnapshotId,
            'road_distance_metres'=>$result->roadDistanceMetres,'straight_line_distance_metres'=>$result->straightLineDistanceMetres,'duration_seconds'=>$result->durationSeconds,
            'distance_basis'=>$result->distanceBasis(),'eta_basis'=>$result->etaBasis(),'freshness_status'=>$result->freshnessStatus(),
        ];
    }

    private function validateDefinition(array $input,string $companyId): array
    {
        $name=trim((string)($input['name'] ?? '')); if($name==='') throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_INVALID','Territory name is required.');
        $effect=(string)($input['effect'] ?? 'include'); if(!in_array($effect,self::EFFECTS,true)) throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_INVALID','Unsupported territory effect.');
        $mode=(string)($input['match_mode'] ?? ''); if(!in_array($mode,self::MATCH_MODES,true)) throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_INVALID','Unsupported territory match mode.');
        $branch=isset($input['branch_public_id']) ? trim((string)$input['branch_public_id']) : null;
        if(in_array($mode,['road_distance','drive_time'],true)) {
            if(!$branch) throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_INVALID','Travel zones require a branch reference.');
            if(!MapLocation::query()->forCompany($companyId)->where('reference_type','branch')->where('public_reference_id',$branch)->exists()) throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_BRANCH_LOCATION_MISSING','Travel-zone branch is not a canonical company branch location.');
        }
        $status=(string)($input['status'] ?? 'active');
        if(!in_array($status,self::STATUSES,true)) throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_INVALID','Unsupported territory status.');
        if($mode==='circle') {
            if(!is_numeric($input['center_latitude']??null)||!is_numeric($input['center_longitude']??null)||!is_numeric($input['radius_metres']??null)||(float)$input['radius_metres']<=0) throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_INVALID','Circle territories require centre coordinates and positive radius.');
            $this->validateCoordinate((float)$input['center_latitude'],(float)$input['center_longitude']);
        }
        if($mode==='polygon') $this->validatePolygonGeometry((array)($input['geometry']??[]));
        if(in_array($mode,['postcode','suburb'],true) && count(array_filter((array)($input['locality_values']??[])))<1) throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_INVALID','Locality territories require at least one value.');
        if($mode==='road_distance' && (!is_numeric($input['maximum_road_distance_metres']??null)||(int)$input['maximum_road_distance_metres']<1)) throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_INVALID','Road-distance zones require a positive maximum road distance.');
        if($mode==='drive_time' && (!is_numeric($input['maximum_drive_time_seconds']??null)||(int)$input['maximum_drive_time_seconds']<1)) throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_INVALID','Drive-time zones require a positive maximum drive time.');
        $hint=$input['pricing_hint']??null;
        if(is_array($hint) && $hint!==[]) {
            if(!in_array(($hint['type']??null),['fixed','percent'],true)||!is_numeric($hint['value']??null)||(float)$hint['value']<0) throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_INVALID','Pricing hint must be fixed/percent with a non-negative value.');
        }
        return [
            'name'=>$name,'description'=>$input['description']??null,'effect'=>$effect,'match_mode'=>$mode,'priority'=>(int)($input['priority']??0),'status'=>$status,'branch_public_id'=>$branch ?: null,
            'service_keys'=>array_values(array_filter(array_map('strval',(array)($input['service_keys']??[])))),'center_latitude'=>$input['center_latitude']??null,'center_longitude'=>$input['center_longitude']??null,'radius_metres'=>$input['radius_metres']??null,
            'geometry'=>$input['geometry']??null,'locality_values'=>array_values(array_filter(array_map('trim',(array)($input['locality_values']??[])))),'maximum_road_distance_metres'=>$input['maximum_road_distance_metres']??null,'maximum_drive_time_seconds'=>$input['maximum_drive_time_seconds']??null,
            'pricing_hint'=>$hint,'effective_from'=>$input['effective_from']??null,'effective_until'=>$input['effective_until']??null,
        ];
    }

    private function validateCoordinate(float $latitude,float $longitude): void
    {
        new Coordinates($latitude,$longitude);
    }

    private function validatePolygonGeometry(array $geometry): void
    {
        if(count($geometry)<3) throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_INVALID','Polygon territories require at least three points.');
        foreach($geometry as $index=>$point) {
            if(!is_array($point)) throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_INVALID','Polygon vertices must be coordinate objects.',['vertex'=>$index]);
            $lat=$point['lat'] ?? $point['latitude'] ?? null;
            $lng=$point['lng'] ?? $point['longitude'] ?? null;
            if(!is_numeric($lat)||!is_numeric($lng)) throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_INVALID','Polygon vertices require latitude and longitude.',['vertex'=>$index]);
            $this->validateCoordinate((float)$lat,(float)$lng);
        }
    }

    private function validateTarget(array $target): array
    {
        $hasCoordinates=is_numeric($target['latitude']??null)&&is_numeric($target['longitude']??null);
        if($hasCoordinates) { new Coordinates((float)$target['latitude'],(float)$target['longitude']); }
        if(!$hasCoordinates && trim((string)($target['postcode']??''))==='' && trim((string)($target['suburb']??''))==='') throw MapsIntelligenceException::fromCode('MAPS_TERRITORY_TARGET_INVALID','Evaluation requires coordinates, postcode or suburb.');
        if($hasCoordinates){$target['latitude']=(float)$target['latitude'];$target['longitude']=(float)$target['longitude'];}
        return $target;
    }

    private function matchRow(ServiceTerritory $t,string $basis,?float $distance,?int $duration,array $evidence): array
    {
        return ['id'=>(string)$t->id,'name'=>(string)$t->name,'effect'=>(string)$t->effect,'match_mode'=>(string)$t->match_mode,'priority'=>(int)$t->priority,'branch_public_id'=>$t->branch_public_id,'basis'=>$basis,'distance_metres'=>$distance,'duration_seconds'=>$duration,'evidence'=>$evidence];
    }

    private function bestTravelMatch(array $matches): ?array
    {
        foreach($matches as $m) if(in_array($m['match_mode'],['road_distance','drive_time'],true)&&$m['effect']==='include') return $m;
        return null;
    }
}

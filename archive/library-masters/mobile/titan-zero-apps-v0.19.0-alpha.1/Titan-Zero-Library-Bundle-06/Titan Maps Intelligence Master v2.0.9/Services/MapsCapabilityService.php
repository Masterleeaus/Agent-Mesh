<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Tools\AnalyseTerritoryTool;
use App\Extensions\TitanMapsIntelligence\Tools\ApproveCandidateTool;
use App\Extensions\TitanMapsIntelligence\Tools\CancelSearchTool;
use App\Extensions\TitanMapsIntelligence\Tools\ClassifyCandidateTool;
use App\Extensions\TitanMapsIntelligence\Tools\ExportSearchTool;
use App\Extensions\TitanMapsIntelligence\Tools\GetSearchTool;
use App\Extensions\TitanMapsIntelligence\Tools\ListCandidatesTool;
use App\Extensions\TitanMapsIntelligence\Tools\MatchCandidateTool;
use App\Extensions\TitanMapsIntelligence\Tools\PromoteCandidateTool;
use App\Extensions\TitanMapsIntelligence\Tools\ReadUsageTool;
use App\Extensions\TitanMapsIntelligence\Tools\RejectCandidateTool;
use App\Extensions\TitanMapsIntelligence\Tools\SearchBusinessesTool;
use App\Extensions\TitanMapsIntelligence\Tools\ReadRouteHistoryTool;
use App\Extensions\TitanMapsIntelligence\Tools\CalculateRouteTool;
use App\Extensions\TitanMapsIntelligence\Tools\CalculateTravelMatrixTool;
use App\Extensions\TitanMapsIntelligence\Tools\FindNearestResourceTool;
use App\Extensions\TitanMapsIntelligence\Tools\ManageRoutePlanTool;
use App\Extensions\TitanMapsIntelligence\Tools\ReadRoutePlansTool;
use App\Extensions\TitanMapsIntelligence\Tools\RecommendDispatchTool;
use App\Extensions\TitanMapsIntelligence\Tools\ReadDispatchRecommendationsTool;
use App\Extensions\TitanMapsIntelligence\Tools\DecideDispatchRecommendationTool;
use App\Extensions\TitanMapsIntelligence\Tools\ManageServiceTerritoryTool;
use App\Extensions\TitanMapsIntelligence\Tools\ReadServiceTerritoriesTool;
use App\Extensions\TitanMapsIntelligence\Tools\EvaluateServiceTerritoryTool;
use App\Extensions\TitanMapsIntelligence\Tools\ReadGeographicPricingSignalsTool;
use App\Extensions\TitanMapsIntelligence\Tools\ReadTerritoryAnalyticsTool;
use App\Extensions\TitanMapsIntelligence\Tools\RunTerritoryAnalyticsTool;
use App\Extensions\TitanMapsIntelligence\Tools\StartResourceFallbackTool;
use App\Extensions\TitanMapsIntelligence\Tools\ReadResourceFallbackTool;
use App\Extensions\TitanMapsIntelligence\Tools\DecideResourceFallbackTool;
use App\Extensions\TitanMapsIntelligence\Tools\PromoteResourceFallbackTool;
use App\Extensions\TitanMapsIntelligence\Tools\GeocodeLocationTool;
use App\Extensions\TitanMapsIntelligence\Tools\LookupTerritoryTool;
use App\Extensions\TitanMapsIntelligence\Tools\ValidateTerritoryTool;
use App\Extensions\TitanMapsIntelligence\Tools\EstimateRouteTool;
use App\Extensions\TitanMapsIntelligence\Tools\CompareRoutesTool;
use App\Extensions\TitanMapsIntelligence\Tools\GetJobTravelContextTool;
use App\Extensions\TitanMapsIntelligence\Tools\CheckServiceAreaTool;
use App\Extensions\TitanMapsIntelligence\Tools\NearbySearchTool;
use App\Extensions\TitanMapsIntelligence\Tools\ReadProviderQuotaTool;
use App\Extensions\TitanMapsIntelligence\Tools\ReadProviderHealthTool;
use App\Extensions\TitanMapsIntelligence\Tools\OverrideProviderQuotaTool;
use App\Extensions\TitanMapsIntelligence\Tools\ReadDispatchWeightsTool;
use App\Extensions\TitanMapsIntelligence\Tools\UpdateDispatchWeightsTool;

final class MapsCapabilityService
{
    public function __construct(private readonly MapsConfiguration $configuration, private readonly ?SpatialCapabilityPolicyCatalog $policies = null) {}

    public function definitions(): array
    {
        return [
            $this->definition('titan-maps-intelligence.search.businesses', 'titan-maps-intelligence.search.create', SearchBusinessesTool::class, [
                'query' => $this->string(),
                'purpose' => $this->enum(['provider_discovery', 'supplier_discovery', 'sales_lead_discovery', 'competitor_analysis', 'accommodation_discovery', 'emergency_sourcing']),
                'maximum_results' => ['type' => 'integer', 'minimum' => 1, 'maximum' => $this->configuration->maximumResults()],
                'language' => $this->string(), 'country' => $this->string(), 'category' => $this->string(),
                'latitude' => ['type' => 'number', 'minimum' => -90, 'maximum' => 90],
                'longitude' => ['type' => 'number', 'minimum' => -180, 'maximum' => 180],
                'radius_metres' => ['type' => 'number', 'exclusiveMinimum' => 0, 'maximum' => $this->configuration->maximumRadiusMetres()],
                'open_now' => ['type' => 'boolean'], 'minimum_rating' => ['type' => 'number', 'minimum' => 0, 'maximum' => 5],
                'conversation_id' => $this->string(), 'agent_id' => $this->string(), 'correlation_id' => $this->string(),
            ], ['query']),
            $this->definition('titan-maps-intelligence.search.read', 'titan-maps-intelligence.search.read', GetSearchTool::class, ['search_id' => $this->string()], ['search_id']),
            $this->definition('titan-maps-intelligence.search.cancel', 'titan-maps-intelligence.search.cancel', CancelSearchTool::class, ['search_id' => $this->string()], ['search_id']),
            $this->definition('titan-maps-intelligence.search.export', 'titan-maps-intelligence.search.export', ExportSearchTool::class, [
                'search_id' => $this->string(), 'format' => $this->enum(['csv', 'json', 'xlsx']),
                'candidate_status' => $this->enum(['approved', 'rejected', 'pending', 'unreviewed']),
                'agent_id' => $this->string(), 'conversation_id' => $this->string(),
            ], ['search_id', 'format']),
            $this->definition('titan-maps-intelligence.candidates.list', 'titan-maps-intelligence.candidate.read', ListCandidatesTool::class, ['search_id' => $this->string(), 'limit' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 100]], ['search_id']),
            $this->definition('titan-maps-intelligence.candidate.match', 'titan-maps-intelligence.candidate.read', MatchCandidateTool::class, [
                'candidate_id' => $this->string(), 'workcore_entity_type' => $this->enum(['lead', 'customer', 'provider', 'contractor', 'supplier']),
                'workcore_entity_id' => $this->string(), 'agent_id' => $this->string(), 'conversation_id' => $this->string(),
            ], ['candidate_id', 'workcore_entity_type', 'workcore_entity_id']),
            $this->definition('titan-maps-intelligence.candidate.classify', 'titan-maps-intelligence.candidate.classify', ClassifyCandidateTool::class, [
                'candidate_id' => $this->string(), 'candidate_type' => $this->enum(['sales_lead', 'customer_candidate', 'provider_candidate', 'contractor_candidate', 'supplier_candidate', 'property_operator', 'accommodation_provider', 'property_manager', 'facilities_manager', 'competitor', 'emergency_provider', 'irrelevant', 'unclassified']),
                'reason' => $this->string(), 'agent_id' => $this->string(), 'conversation_id' => $this->string(),
            ], ['candidate_id', 'candidate_type']),
            $this->definition('titan-maps-intelligence.candidate.approve', 'titan-maps-intelligence.candidate.approve', ApproveCandidateTool::class, ['candidate_id' => $this->string(), 'confirmed'=>['type'=>'boolean'], 'agent_id' => $this->string(), 'conversation_id' => $this->string()], ['candidate_id','confirmed']),
            $this->definition('titan-maps-intelligence.candidate.reject', 'titan-maps-intelligence.candidate.reject', RejectCandidateTool::class, ['candidate_id' => $this->string(), 'reason' => $this->string(), 'confirmed'=>['type'=>'boolean'], 'agent_id' => $this->string(), 'conversation_id' => $this->string()], ['candidate_id', 'reason','confirmed']),
            $this->definition('titan-maps-intelligence.candidate.promote', 'titan-maps-intelligence.candidate.promote', PromoteCandidateTool::class, [
                'candidate_id' => $this->string(), 'target_type' => $this->enum(['lead', 'customer', 'provider', 'contractor', 'supplier']),
                'accepted_fields' => ['type' => 'array', 'minItems' => 1, 'uniqueItems' => true, 'items' => $this->enum(['name', 'phone', 'website', 'public_email', 'address', 'categories'])],
                'confirmed'=>['type'=>'boolean'],
                'agent_id' => $this->string(), 'conversation_id' => $this->string(), 'correlation_id' => $this->string(),
            ], ['candidate_id', 'target_type', 'accepted_fields', 'confirmed']),
            $this->definition('titan-maps-intelligence.territory.analyse', 'titan-maps-intelligence.territory.analyse', AnalyseTerritoryTool::class, [
                'search_id' => $this->string(), 'analysis_type' => $this->enum(['provider_coverage', 'competitor_density', 'supplier_coverage', 'service_gap', 'branch_coverage', 'expansion_opportunity']),
                'search_area' => ['type' => 'object'], 'agent_id' => $this->string(), 'conversation_id' => $this->string(),
            ], ['search_id']),
            $this->definition('titan-maps-intelligence.territory-analytics.run', 'titan-maps-intelligence.territory.analyse', RunTerritoryAnalyticsTool::class, [
                'search_id'=>$this->string(),'analysis_type'=>$this->enum(['provider_coverage','competitor_density','supplier_coverage','service_gap','branch_coverage','expansion_opportunity']),
                'search_area'=>['type'=>'object'],'agent_id'=>$this->string(),'conversation_id'=>$this->string(),'correlation_id'=>$this->string(),
            ], ['search_id','analysis_type']),
            $this->definition('titan-maps-intelligence.territory-analytics.read', 'titan-maps-intelligence.territory.analyse', ReadTerritoryAnalyticsTool::class, [
                'analysis_type'=>$this->enum(['provider_coverage','competitor_density','supplier_coverage','service_gap','branch_coverage','expansion_opportunity']),
                'limit'=>['type'=>'integer','minimum'=>1,'maximum'=>$this->configuration->territoryAnalyticsHistoryLimit()],
            ], []),
            $this->definition('titan-maps-intelligence.territory.manage', 'titan-maps-intelligence.territory.manage', ManageServiceTerritoryTool::class, [
                'name'=>$this->string(),'description'=>$this->string(),'effect'=>$this->enum(['include','exclude']),'match_mode'=>$this->enum(['circle','polygon','postcode','suburb','road_distance','drive_time']),
                'priority'=>['type'=>'integer','minimum'=>-32768,'maximum'=>32767],'branch_public_id'=>$this->string(),'service_keys'=>['type'=>'array','items'=>$this->string()],
                'center_latitude'=>['type'=>'number','minimum'=>-90,'maximum'=>90],'center_longitude'=>['type'=>'number','minimum'=>-180,'maximum'=>180],'radius_metres'=>['type'=>'number','exclusiveMinimum'=>0],
                'geometry'=>['type'=>'array','items'=>['type'=>'object']],'locality_values'=>['type'=>'array','items'=>$this->string()],'maximum_road_distance_metres'=>['type'=>'integer','minimum'=>1],'maximum_drive_time_seconds'=>['type'=>'integer','minimum'=>1],
                'pricing_hint'=>['type'=>'object'],
            ], ['name','effect','match_mode']),
            $this->definition('titan-maps-intelligence.territory.read', 'titan-maps-intelligence.territory.read', ReadServiceTerritoriesTool::class, [
                'limit'=>['type'=>'integer','minimum'=>1,'maximum'=>100],
            ], []),
            $this->definition('titan-maps-intelligence.territory.evaluate', 'titan-maps-intelligence.territory.evaluate', EvaluateServiceTerritoryTool::class, [
                'latitude'=>['type'=>'number','minimum'=>-90,'maximum'=>90],'longitude'=>['type'=>'number','minimum'=>-180,'maximum'=>180],'suburb'=>$this->string(),'postcode'=>$this->string(),'service_key'=>$this->string(),'target_reference_type'=>$this->string(),'target_public_reference_id'=>$this->string(),
            ], []),
            $this->definition('titan-maps-intelligence.geographic-pricing.read', 'titan-maps-intelligence.geographic-pricing.read', ReadGeographicPricingSignalsTool::class, [
                'limit'=>['type'=>'integer','minimum'=>1,'maximum'=>100],
            ], []),
            $this->definition('titan-maps-intelligence.route.calculate', 'titan-maps-intelligence.route.calculate', CalculateRouteTool::class, [
                'origin_latitude' => ['type'=>'number','minimum'=>-90,'maximum'=>90],
                'origin_longitude' => ['type'=>'number','minimum'=>-180,'maximum'=>180],
                'destination_latitude' => ['type'=>'number','minimum'=>-90,'maximum'=>90],
                'destination_longitude' => ['type'=>'number','minimum'=>-180,'maximum'=>180],
                'travel_mode' => $this->enum(['DRIVE','WALK','BICYCLE','TWO_WHEELER','TRANSIT']),
                'routing_preference' => $this->enum(['TRAFFIC_UNAWARE','TRAFFIC_AWARE','TRAFFIC_AWARE_OPTIMAL']),
                'departure_time' => $this->string(),'worker_public_id'=>$this->string(),'customer_public_id'=>$this->string(),'origin_reference_type'=>$this->string(),'origin_public_reference_id'=>$this->string(),'destination_reference_type'=>$this->string(),'destination_public_reference_id'=>$this->string(),
            ], ['origin_latitude','origin_longitude','destination_latitude','destination_longitude']),
            $this->definition('titan-maps-intelligence.route.history', 'titan-maps-intelligence.route.read', ReadRouteHistoryTool::class, [
                'limit' => ['type'=>'integer','minimum'=>1,'maximum'=>$this->configuration->routeHistoryLimit()],'worker_public_id'=>$this->string(),'customer_public_id'=>$this->string(),'date_from'=>$this->string(),'date_to'=>$this->string(),
            ], []),
            $this->definition('titan-maps-intelligence.travel-matrix.calculate', 'titan-maps-intelligence.matrix.calculate', CalculateTravelMatrixTool::class, [
                'origins' => ['type'=>'array','minItems'=>1,'maxItems'=>$this->configuration->matrixMaximumOrigins(),'items'=>['type'=>'object','properties'=>[
                    'latitude'=>['type'=>'number','minimum'=>-90,'maximum'=>90],
                    'longitude'=>['type'=>'number','minimum'=>-180,'maximum'=>180],
                    'reference_type'=>$this->string(),'public_reference_id'=>$this->string(),'label'=>$this->string(),
                ],'required'=>['latitude','longitude'],'additionalProperties'=>false]],
                'destinations' => ['type'=>'array','minItems'=>1,'maxItems'=>$this->configuration->matrixMaximumDestinations(),'items'=>['type'=>'object','properties'=>[
                    'latitude'=>['type'=>'number','minimum'=>-90,'maximum'=>90],
                    'longitude'=>['type'=>'number','minimum'=>-180,'maximum'=>180],
                    'reference_type'=>$this->string(),'public_reference_id'=>$this->string(),'label'=>$this->string(),
                ],'required'=>['latitude','longitude'],'additionalProperties'=>false]],
                'travel_mode'=>$this->enum(['DRIVE','WALK','BICYCLE','TWO_WHEELER','TRANSIT']),
                'routing_preference'=>$this->enum(['TRAFFIC_UNAWARE','TRAFFIC_AWARE','TRAFFIC_AWARE_OPTIMAL']),
                'departure_time'=>$this->string(),
            ], ['origins','destinations']),
            $this->definition('titan-maps-intelligence.route-plan.manage', 'titan-maps-intelligence.route-plan.manage', ManageRoutePlanTool::class, [
                'action'=>$this->enum(['create','optimise','emergency','stop_status']),
                'plan_id'=>$this->string(),'stop_id'=>$this->string(),'status'=>$this->enum(['planned','completed','cancelled']),
                'name'=>$this->string(),'service_date'=>$this->string(),'worker_public_id'=>$this->string(),'start_at'=>$this->string(),
                'travel_mode'=>$this->enum(['DRIVE','WALK','BICYCLE','TWO_WHEELER','TRANSIT']),
                'routing_preference'=>$this->enum(['TRAFFIC_UNAWARE','TRAFFIC_AWARE','TRAFFIC_AWARE_OPTIMAL']),
                'render_geometry'=>['type'=>'boolean'],
                'stops'=>['type'=>'array','minItems'=>2,'maxItems'=>$this->configuration->routePlanMaximumStops(),'items'=>['type'=>'object']],
                'stop'=>['type'=>'object'],
            ], ['action']),
            $this->definition('titan-maps-intelligence.route-plan.read', 'titan-maps-intelligence.route-plan.read', ReadRoutePlansTool::class, [
                'limit'=>['type'=>'integer','minimum'=>1,'maximum'=>$this->configuration->routePlanHistoryLimit()],
            ], []),
            $this->definition('titan-maps-intelligence.nearest-resource.find', 'titan-maps-intelligence.nearest-resource.find', FindNearestResourceTool::class, [
                'origin_latitude'=>['type'=>'number','minimum'=>-90,'maximum'=>90],
                'origin_longitude'=>['type'=>'number','minimum'=>-180,'maximum'=>180],
                'resource_type'=>$this->enum(['all','worker','supplier','contractor']),
                'limit'=>['type'=>'integer','minimum'=>1,'maximum'=>$this->configuration->nearestResourceLimit()],
                'travel_mode'=>$this->enum(['DRIVE','WALK','BICYCLE','TWO_WHEELER','TRANSIT']),
                'routing_preference'=>$this->enum(['TRAFFIC_UNAWARE','TRAFFIC_AWARE','TRAFFIC_AWARE_OPTIMAL']),
            ], ['origin_latitude','origin_longitude']),
            $this->definition('titan-maps-intelligence.dispatch.recommend', 'titan-maps-intelligence.dispatch.recommend', RecommendDispatchTool::class, [
                'job_public_id'=>$this->string(),
                'limit'=>['type'=>'integer','minimum'=>1,'maximum'=>$this->configuration->dispatchCandidateLimit()],
                'travel_mode'=>$this->enum(['DRIVE','WALK','BICYCLE','TWO_WHEELER','TRANSIT']),
                'routing_preference'=>$this->enum(['TRAFFIC_UNAWARE','TRAFFIC_AWARE','TRAFFIC_AWARE_OPTIMAL']),
            ], ['job_public_id']),
            $this->definition('titan-maps-intelligence.dispatch.read', 'titan-maps-intelligence.dispatch.read', ReadDispatchRecommendationsTool::class, [
                'limit'=>['type'=>'integer','minimum'=>1,'maximum'=>100],
            ], []),
            $this->definition('titan-maps-intelligence.dispatch.decide', 'titan-maps-intelligence.dispatch.manage', DecideDispatchRecommendationTool::class, [
                'recommendation_id'=>$this->string(),'candidate_id'=>$this->string(),
                'decision'=>$this->enum(['approve','reject']),'assign'=>['type'=>'boolean'],'reason'=>$this->string(),'confirmed'=>['type'=>'boolean'],
            ], ['recommendation_id','decision','confirmed']),
            $this->definition('titan-maps-intelligence.resource-fallback.start', 'titan-maps-intelligence.resource-fallback.start', StartResourceFallbackTool::class, [
                'resource_type'=>$this->enum(['contractor','supplier']),
                'operational_need_type'=>$this->enum(['manual','job','inventory_shortage']),'operational_need_public_id'=>$this->string(),
                'job_public_id'=>$this->string(),'service_key'=>$this->string(),'query'=>$this->string(),
                'latitude'=>['type'=>'number','minimum'=>-90,'maximum'=>90],
                'longitude'=>['type'=>'number','minimum'=>-180,'maximum'=>180],
                'radius_metres'=>['type'=>'number','minimum'=>100,'maximum'=>$this->configuration->maximumRadiusMetres()],
                'travel_mode'=>$this->enum(['DRIVE','WALK','BICYCLE','TWO_WHEELER']),
                'routing_preference'=>$this->enum(['TRAFFIC_AWARE','TRAFFIC_AWARE_OPTIMAL','TRAFFIC_UNAWARE']),'open_now'=>['type'=>'boolean'],
            ], ['resource_type']),
            $this->definition('titan-maps-intelligence.resource-fallback.read', 'titan-maps-intelligence.resource-fallback.read', ReadResourceFallbackTool::class, [
                'fallback_request_id'=>$this->string(),
                'limit'=>['type'=>'integer','minimum'=>1,'maximum'=>$this->configuration->fallbackHistoryLimit()],
            ], []),
            $this->definition('titan-maps-intelligence.resource-fallback.decide', 'titan-maps-intelligence.resource-fallback.decide', DecideResourceFallbackTool::class, [
                'fallback_request_id'=>$this->string(),'candidate_id'=>$this->string(),
                'decision'=>$this->enum(['approve','reject']),'reason'=>$this->string(),'confirmed'=>['type'=>'boolean'],
            ], ['fallback_request_id','candidate_id','decision','confirmed']),
            $this->definition('titan-maps-intelligence.resource-fallback.promote', 'titan-maps-intelligence.resource-fallback.promote', PromoteResourceFallbackTool::class, [
                'fallback_request_id'=>$this->string(),'candidate_id'=>$this->string(),
                'accepted_fields'=>['type'=>'array','minItems'=>1,'uniqueItems'=>true,'items'=>$this->enum(['name','phone','website','public_email','address','categories'])],
                'reason'=>$this->string(),'agent_id'=>$this->string(),'conversation_id'=>$this->string(),'correlation_id'=>$this->string(),'confirmed'=>['type'=>'boolean'],
            ], ['fallback_request_id','candidate_id','accepted_fields','confirmed']),
            $this->definition('location.geocode', 'titan-maps-intelligence.location.geocode', GeocodeLocationTool::class, [
                'address'=>$this->string(),'language_code'=>$this->string(),'region_code'=>$this->string(),
            ], ['address']),
            $this->definition('territory.lookup', 'titan-maps-intelligence.territory.evaluate', LookupTerritoryTool::class, [
                'latitude'=>['type'=>'number','minimum'=>-90,'maximum'=>90],'longitude'=>['type'=>'number','minimum'=>-180,'maximum'=>180],
                'postcode'=>$this->string(),'suburb'=>$this->string(),'service_key'=>$this->string(),
            ], []),
            $this->definition('territory.validate', 'titan-maps-intelligence.territory.evaluate', ValidateTerritoryTool::class, [
                'latitude'=>['type'=>'number','minimum'=>-90,'maximum'=>90],'longitude'=>['type'=>'number','minimum'=>-180,'maximum'=>180],
                'postcode'=>$this->string(),'suburb'=>$this->string(),'service_key'=>$this->string(),
            ], []),
            $this->definition('route.estimate', 'titan-maps-intelligence.route.calculate', EstimateRouteTool::class, [
                'origin_latitude'=>['type'=>'number','minimum'=>-90,'maximum'=>90],'origin_longitude'=>['type'=>'number','minimum'=>-180,'maximum'=>180],
                'destination_latitude'=>['type'=>'number','minimum'=>-90,'maximum'=>90],'destination_longitude'=>['type'=>'number','minimum'=>-180,'maximum'=>180],
                'travel_mode'=>$this->enum(['DRIVE','WALK','BICYCLE','TWO_WHEELER','TRANSIT']),'routing_preference'=>$this->enum(['TRAFFIC_UNAWARE','TRAFFIC_AWARE','TRAFFIC_AWARE_OPTIMAL']),'departure_time'=>$this->string(),'worker_public_id'=>$this->string(),'customer_public_id'=>$this->string(),'origin_reference_type'=>$this->string(),'origin_public_reference_id'=>$this->string(),'destination_reference_type'=>$this->string(),'destination_public_reference_id'=>$this->string(),
            ], ['origin_latitude','origin_longitude','destination_latitude','destination_longitude']),
            $this->definition('route.compare', 'titan-maps-intelligence.matrix.calculate', CompareRoutesTool::class, [
                'origin_latitude'=>['type'=>'number','minimum'=>-90,'maximum'=>90],'origin_longitude'=>['type'=>'number','minimum'=>-180,'maximum'=>180],
                'destinations'=>['type'=>'array','minItems'=>1,'maxItems'=>$this->configuration->matrixMaximumDestinations(),'items'=>['type'=>'object','properties'=>['latitude'=>['type'=>'number','minimum'=>-90,'maximum'=>90],'longitude'=>['type'=>'number','minimum'=>-180,'maximum'=>180],'reference_type'=>$this->string(),'public_reference_id'=>$this->string(),'label'=>$this->string()],'required'=>['latitude','longitude'],'additionalProperties'=>false]],
                'travel_mode'=>$this->enum(['DRIVE','WALK','BICYCLE','TWO_WHEELER','TRANSIT']),'routing_preference'=>$this->enum(['TRAFFIC_UNAWARE','TRAFFIC_AWARE','TRAFFIC_AWARE_OPTIMAL']),'departure_time'=>$this->string(),
            ], ['origin_latitude','origin_longitude','destinations']),
            $this->definition('job.travel_context', 'titan-maps-intelligence.job.travel-context.read', GetJobTravelContextTool::class, [
                'job_public_id'=>$this->string(),'branch_public_id'=>$this->string(),'service_key'=>$this->string(),
            ], ['job_public_id']),
            $this->definition('service_area.check', 'titan-maps-intelligence.territory.evaluate', CheckServiceAreaTool::class, [
                'latitude'=>['type'=>'number','minimum'=>-90,'maximum'=>90],'longitude'=>['type'=>'number','minimum'=>-180,'maximum'=>180],
                'postcode'=>$this->string(),'suburb'=>$this->string(),'service_key'=>$this->string(),'target_reference_type'=>$this->string(),'target_public_reference_id'=>$this->string(),
            ], []),
            $this->definition('nearby.search', 'titan-maps-intelligence.nearest-resource.find', NearbySearchTool::class, [
                'latitude'=>['type'=>'number','minimum'=>-90,'maximum'=>90],'longitude'=>['type'=>'number','minimum'=>-180,'maximum'=>180],
                'resource_type'=>$this->enum(['all','worker','supplier','contractor']),'limit'=>['type'=>'integer','minimum'=>1,'maximum'=>$this->configuration->nearestResourceLimit()],
                'travel_mode'=>$this->enum(['DRIVE','WALK','BICYCLE','TWO_WHEELER','TRANSIT']),'routing_preference'=>$this->enum(['TRAFFIC_UNAWARE','TRAFFIC_AWARE','TRAFFIC_AWARE_OPTIMAL']),
            ], ['latitude','longitude']),
            $this->definition('maps.provider.health', 'titan-maps-intelligence.provider-health.read', ReadProviderHealthTool::class, [
                'provider'=>$this->string(),
            ], []),
            $this->definition('maps.quota.status', 'titan-maps-intelligence.provider-quota.read', ReadProviderQuotaTool::class, [
                'provider'=>$this->string(),
            ], []),
            $this->definition('maps.provider.quota.override', 'titan-maps-intelligence.provider-quota.override', OverrideProviderQuotaTool::class, [
                'provider'=>$this->string(),'minutes'=>['type'=>'integer','minimum'=>1,'maximum'=>1440],'reason'=>$this->string(),'confirmed'=>['type'=>'boolean'],
            ], ['provider','confirmed']),
            $this->definition('maps.dispatch.weights.read', 'titan-maps-intelligence.dispatch.weights.read', ReadDispatchWeightsTool::class, [
                'vertical'=>$this->string(),
            ], []),
            $this->definition('maps.dispatch.weights.update', 'titan-maps-intelligence.dispatch.weights.update', UpdateDispatchWeightsTool::class, [
                'vertical'=>$this->string(),'policy_version'=>$this->string(),'weights'=>['type'=>'object','properties'=>[
                    'travel'=>['type'=>'number','minimum'=>0,'maximum'=>100],'skill'=>['type'=>'number','minimum'=>0,'maximum'=>100],'availability'=>['type'=>'number','minimum'=>0,'maximum'=>100],'workload'=>['type'=>'number','minimum'=>0,'maximum'=>100],'territory'=>['type'=>'number','minimum'=>0,'maximum'=>100],'continuity'=>['type'=>'number','minimum'=>0,'maximum'=>100],'urgency'=>['type'=>'number','minimum'=>0,'maximum'=>100],
                ],'required'=>['travel','skill','availability','workload','territory','continuity','urgency'],'additionalProperties'=>false],'confirmed'=>['type'=>'boolean'],
            ], ['weights','confirmed']),
            $this->definition('titan-maps-intelligence.usage.read', 'titan-maps-intelligence.usage.read', ReadUsageTool::class, ['search_id' => $this->string()], []),
        ];
    }

    private function definition(string $id, string $permission, string $handler, array $properties, array $required): array
    {
        $catalog = $this->policies ?? new SpatialCapabilityPolicyCatalog();
        $policy = $catalog->policy($id);
        $properties = array_merge($this->executionProperties(), $properties);
        return [
            'id' => $id,
            'capability_name' => $id,
            'owner' => 'titan-maps-intelligence',
            'capability_version' => '2.0',
            'permission' => $permission,
            'handler' => $handler,
            'description' => str_replace(['titan-maps-intelligence.', '.'], ['', ' '], $id),
            'risk_profile' => $policy['risk_profile'],
            'autonomy_requirement' => $policy['autonomy_requirement'],
            'evidence_requirements' => $policy['evidence_requirements'],
            'offline_policy' => $policy['offline_policy'],
            'reversibility' => $policy['reversibility'],
            'idempotency_strategy' => $policy['idempotency_strategy'],
            'mutation_class' => $policy['mutation_class'],
            'canonical_alias' => $this->canonicalAlias($id),
            'input_schema' => ['type' => 'object', 'properties' => $properties, 'required' => $required, 'additionalProperties' => false],
            'output_schema' => [
                'type' => 'object',
                'properties' => [
                    'ok' => ['type' => 'boolean'],
                    'data' => ['type' => ['object', 'array', 'null']],
                    'error' => ['type' => ['object', 'null']],
                    'governance_receipt' => ['type' => ['object', 'null']],
                ],
                'required' => ['ok'],
                'additionalProperties' => false,
            ],
        ];
    }

    private function executionProperties(): array
    {
        return [
            'trace_id' => $this->string(),
            'correlation_id' => $this->string(),
            'causation_id' => $this->string(),
            'agent_id' => $this->string(),
            'conversation_id' => $this->string(),
        ];
    }

    private function canonicalAlias(string $id): ?string
    {
        return [
            'titan-maps-intelligence.route.calculate' => 'route.estimate',
            'titan-maps-intelligence.travel-matrix.calculate' => 'route.compare',
            'titan-maps-intelligence.territory.evaluate' => 'service_area.check',
            'titan-maps-intelligence.nearest-resource.find' => 'nearby.search',
        ][$id] ?? (in_array($id, SpatialCapabilityPolicyCatalog::CANONICAL, true) ? $id : null);
    }

    private function string(): array
    {
        return ['type' => 'string', 'minLength' => 1];
    }

    private function enum(array $values): array
    {
        return ['type' => 'string', 'enum' => $values];
    }
}

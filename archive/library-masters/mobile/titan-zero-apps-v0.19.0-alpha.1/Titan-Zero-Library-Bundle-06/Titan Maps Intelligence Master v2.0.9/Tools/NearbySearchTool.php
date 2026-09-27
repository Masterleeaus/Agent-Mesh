<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Tools;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\Services\GovernedSpatialCapabilityExecutor;
use App\Extensions\TitanMapsIntelligence\Services\NearestResourceService;
final class NearbySearchTool
{
 public function __construct(private readonly AuthorisedCompanyContext $context,private readonly PermissionAuthorizer $authorizer,private readonly NearestResourceService $nearest,private readonly GovernedSpatialCapabilityExecutor $governance){}
 public function execute(array $input): array{$input['execution_origin']='ai';$c=$this->context->companyId();$this->authorizer->authorize($this->context->userId(),$c,'titan-maps-intelligence.nearest-resource.find');return $this->governance->execute('nearby.search',$input,fn()=> $this->nearest->find(new Coordinates((float)$input['latitude'],(float)$input['longitude']),(string)($input['resource_type']??'all'),(int)($input['limit']??10),(string)($input['travel_mode']??'DRIVE'),(string)($input['routing_preference']??'TRAFFIC_AWARE')));}
}

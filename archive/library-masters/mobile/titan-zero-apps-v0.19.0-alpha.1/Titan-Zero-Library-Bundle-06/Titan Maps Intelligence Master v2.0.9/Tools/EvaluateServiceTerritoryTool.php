<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Tools;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Services\ServiceTerritoryService;
final class EvaluateServiceTerritoryTool
{
    public function __construct(private readonly AuthorisedCompanyContext $context,private readonly PermissionAuthorizer $authorizer,private readonly ServiceTerritoryService $service){}
    public function execute(array $input): array { $c=$this->context->companyId();$this->authorizer->authorize($this->context->userId(),$c,'titan-maps-intelligence.territory.evaluate');$e=$this->service->evaluate($input);return ['ok'=>true,'data'=>['evaluation_id'=>(string)$e->id,'covered'=>(bool)$e->covered,'branch_public_id'=>$e->branch_public_id,'road_distance_metres'=>$e->road_distance_metres,'duration_seconds'=>$e->duration_seconds,'distance_basis'=>$e->distance_basis,'eta_basis'=>$e->eta_basis,'signals'=>$e->signals->map->toArray()->all()]]; }
}

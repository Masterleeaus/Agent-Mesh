<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Tools;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Services\GovernedSpatialCapabilityExecutor;
use App\Extensions\TitanMapsIntelligence\Services\ServiceTerritoryService;
final class ManageServiceTerritoryTool
{
 public function __construct(private readonly AuthorisedCompanyContext $context,private readonly PermissionAuthorizer $authorizer,private readonly ServiceTerritoryService $service,private readonly GovernedSpatialCapabilityExecutor $governance){}
 public function execute(array $input): array
 {
  $c=$this->context->companyId();$this->authorizer->authorize($this->context->userId(),$c,'titan-maps-intelligence.territory.manage');
  $input['execution_origin']='ai';
  return $this->governance->execute('titan-maps-intelligence.territory.manage',$input,function()use($input){$territory=$this->service->create($input);return ['territory_id'=>(string)$territory->id,'name'=>$territory->name,'match_mode'=>$territory->match_mode,'effect'=>$territory->effect];});
 }
}

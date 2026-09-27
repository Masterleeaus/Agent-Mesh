<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Tools;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Services\GovernedSpatialCapabilityExecutor;
use App\Extensions\TitanMapsIntelligence\Services\ServiceTerritoryService;
final class LookupTerritoryTool
{
 public function __construct(private readonly AuthorisedCompanyContext $context,private readonly PermissionAuthorizer $authorizer,private readonly ServiceTerritoryService $territories,private readonly GovernedSpatialCapabilityExecutor $governance){}
 public function execute(array $input): array{$input['execution_origin']='ai';$c=$this->context->companyId();$this->authorizer->authorize($this->context->userId(),$c,'titan-maps-intelligence.territory.evaluate');return $this->governance->execute('territory.lookup',$input,function()use($input){$e=$this->territories->evaluate($this->target($input));return ['evaluation_id'=>(string)$e->id,'covered'=>(bool)$e->covered,'primary_territory_id'=>$e->primary_territory_id,'blocked_territory_id'=>$e->blocked_territory_id,'branch_public_id'=>$e->branch_public_id,'matched_territories'=>$e->matched_territories,'result_basis'=>$e->result_basis];});}
 private function target(array $i): array{return array_filter(['latitude'=>$i['latitude']??null,'longitude'=>$i['longitude']??null,'postcode'=>$i['postcode']??null,'suburb'=>$i['suburb']??null,'service_key'=>$i['service_key']??null],static fn($v):bool=>$v!==null&&$v!=='');}
}

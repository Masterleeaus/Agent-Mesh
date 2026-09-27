<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Tools;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixRequest;
use App\Extensions\TitanMapsIntelligence\Services\GovernedSpatialCapabilityExecutor;
use App\Extensions\TitanMapsIntelligence\Services\TravelMatrixService;
final class CompareRoutesTool
{
 public function __construct(private readonly AuthorisedCompanyContext $context,private readonly PermissionAuthorizer $authorizer,private readonly TravelMatrixService $matrices,private readonly GovernedSpatialCapabilityExecutor $governance){}
 public function execute(array $input): array{$input['execution_origin']='ai';$c=$this->context->companyId();$this->authorizer->authorize($this->context->userId(),$c,'titan-maps-intelligence.matrix.calculate');return $this->governance->execute('route.compare',$input,function()use($input){$o=new Coordinates((float)$input['origin_latitude'],(float)$input['origin_longitude']);$dest=[];$refs=[];foreach((array)$input['destinations'] as $d){$dest[]=new Coordinates((float)$d['latitude'],(float)$d['longitude']);$refs[]=['reference_type'=>$d['reference_type']??null,'public_reference_id'=>$d['public_reference_id']??null,'label'=>$d['label']??null];}$calc=$this->matrices->calculate(new RouteMatrixRequest([$o],$dest,(string)($input['travel_mode']??'DRIVE'),(string)($input['routing_preference']??'TRAFFIC_AWARE'),isset($input['departure_time'])?(string)$input['departure_time']:null),[['label'=>'Origin']],$refs);$s=$calc['snapshot'];return ['matrix_snapshot_id'=>(string)$s->id,'result_basis'=>(string)$s->result_basis,'provider'=>$s->provider,'cache_status'=>$calc['cache_status'],'calculated_at'=>$s->calculated_at?->toAtomString(),'provider_error_code'=>$s->provider_error_code,'comparisons'=>$s->elements->map(static fn($e):array=>['destination_index'=>(int)$e->destination_index,'road_distance_metres'=>$e->distance_metres===null?null:(int)$e->distance_metres,'straight_line_distance_metres'=>(int)$e->straight_line_distance_metres,'duration_seconds'=>$e->duration_seconds===null?null:(int)$e->duration_seconds,'traffic_delay_seconds'=>$e->traffic_delay_seconds===null?null:(int)$e->traffic_delay_seconds,'condition'=>(string)$e->condition])->all()];});}
}

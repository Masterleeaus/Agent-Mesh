<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tools;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixRequest;
use App\Extensions\TitanMapsIntelligence\Services\TravelMatrixService;

final class CalculateTravelMatrixTool
{
    public function __construct(private readonly AuthorisedCompanyContext $context, private readonly PermissionAuthorizer $authorizer, private readonly TravelMatrixService $matrices) {}
    public function execute(array $input): array
    {
        $companyId=$this->context->companyId(); $this->authorizer->authorize($this->context->userId(),$companyId,'titan-maps-intelligence.matrix.calculate');
        $origins=array_map(static fn(array $p): Coordinates => new Coordinates((float)$p['latitude'],(float)$p['longitude']),$input['origins']);
        $destinations=array_map(static fn(array $p): Coordinates => new Coordinates((float)$p['latitude'],(float)$p['longitude']),$input['destinations']);
        $result=$this->matrices->calculate(new RouteMatrixRequest($origins,$destinations,(string)($input['travel_mode']??'DRIVE'),(string)($input['routing_preference']??'TRAFFIC_AWARE'),$input['departure_time']??null),$input['origins'],$input['destinations']);
        $snapshot=$result['snapshot'];
        return ['ok'=>true,'data'=>['matrix_snapshot_id'=>(string)$snapshot->id,'basis'=>$snapshot->result_basis,'provider'=>$snapshot->provider,'cache_status'=>$result['cache_status'],'element_count'=>(int)$snapshot->element_count,'elements'=>$snapshot->elements->map(static fn($e)=>['origin_index'=>(int)$e->origin_index,'destination_index'=>(int)$e->destination_index,'distance_metres'=>$e->distance_metres,'straight_line_distance_metres'=>(int)$e->straight_line_distance_metres,'duration_seconds'=>$e->duration_seconds,'traffic_delay_seconds'=>$e->traffic_delay_seconds,'condition'=>$e->condition])->values()->all()]];
    }
}

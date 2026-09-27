<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Tools;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\Services\ResourceFallbackService;
final class StartResourceFallbackTool
{
    public function __construct(private readonly ResourceFallbackService $service) {}
    public function execute(array $input): array
    {
        $coords=isset($input['latitude'],$input['longitude'])?new Coordinates((float)$input['latitude'],(float)$input['longitude']):null;
        $record=$this->service->start((string)($input['resource_type']??''),$input['job_public_id']??null,$coords,$input['service_key']??null,$input['query']??null,$input);
        return ['ok'=>true,'data'=>['fallback_request_id'=>(string)$record->id,'status'=>$record->status,'discovery_search_id'=>$record->discovery_search_id]];
    }
}

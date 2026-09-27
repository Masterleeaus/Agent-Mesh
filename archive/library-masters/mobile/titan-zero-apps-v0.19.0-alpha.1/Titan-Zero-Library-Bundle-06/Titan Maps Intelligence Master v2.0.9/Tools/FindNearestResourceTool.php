<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tools;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\Services\NearestResourceService;

final class FindNearestResourceTool
{
    public function __construct(private readonly AuthorisedCompanyContext $context, private readonly PermissionAuthorizer $authorizer, private readonly NearestResourceService $nearest) {}
    public function execute(array $input): array
    {
        $companyId=$this->context->companyId(); $this->authorizer->authorize($this->context->userId(),$companyId,'titan-maps-intelligence.nearest-resource.find');
        return ['ok'=>true,'data'=>$this->nearest->find(new Coordinates((float)$input['origin_latitude'],(float)$input['origin_longitude']),(string)($input['resource_type']??'all'),(int)($input['limit']??10),(string)($input['travel_mode']??'DRIVE'),(string)($input['routing_preference']??'TRAFFIC_AWARE'))];
    }
}

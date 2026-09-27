<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Tools;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Models\ServiceTerritory;
final class ReadServiceTerritoriesTool
{
    public function __construct(private readonly AuthorisedCompanyContext $context,private readonly PermissionAuthorizer $authorizer){}
    public function execute(array $input): array { $c=$this->context->companyId();$this->authorizer->authorize($this->context->userId(),$c,'titan-maps-intelligence.territory.read');$limit=max(1,min(100,(int)($input['limit']??50)));return ['ok'=>true,'data'=>ServiceTerritory::query()->forCompany($c)->orderByDesc('priority')->limit($limit)->get()->map->toArray()->all()]; }
}

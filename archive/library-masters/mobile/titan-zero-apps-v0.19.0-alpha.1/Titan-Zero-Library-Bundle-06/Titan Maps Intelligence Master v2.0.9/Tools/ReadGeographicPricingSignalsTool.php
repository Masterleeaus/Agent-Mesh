<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Tools;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Models\GeographicPricingSignal;
final class ReadGeographicPricingSignalsTool
{
    public function __construct(private readonly AuthorisedCompanyContext $context,private readonly PermissionAuthorizer $authorizer){}
    public function execute(array $input): array { $c=$this->context->companyId();$this->authorizer->authorize($this->context->userId(),$c,'titan-maps-intelligence.geographic-pricing.read');$limit=max(1,min(100,(int)($input['limit']??50)));return ['ok'=>true,'data'=>GeographicPricingSignal::query()->forCompany($c)->latest('emitted_at')->limit($limit)->get()->map->toArray()->all()]; }
}

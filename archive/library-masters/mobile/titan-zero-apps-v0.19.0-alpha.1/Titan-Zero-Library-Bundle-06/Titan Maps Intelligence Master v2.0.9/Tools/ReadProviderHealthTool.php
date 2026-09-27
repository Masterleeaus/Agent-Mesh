<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tools;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Services\ProviderHealthService;

final class ReadProviderHealthTool
{
    public function __construct(private readonly AuthorisedCompanyContext $context, private readonly PermissionAuthorizer $authorizer, private readonly ProviderHealthService $health) {}
    public function execute(array $input): array
    {
        $this->authorizer->authorize($this->context->userId(),$this->context->companyId(),'titan-maps-intelligence.provider-health.read');
        return ['ok'=>true,'data'=>$this->health->status((string)($input['provider'] ?? 'google-routes'))];
    }
}

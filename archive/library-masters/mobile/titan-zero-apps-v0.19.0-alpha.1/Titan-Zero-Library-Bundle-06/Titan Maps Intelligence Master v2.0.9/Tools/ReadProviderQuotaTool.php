<?php
declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Tools;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext; use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer; use App\Extensions\TitanMapsIntelligence\Services\ProviderQuotaGuard;
final class ReadProviderQuotaTool { public function __construct(private readonly AuthorisedCompanyContext $context,private readonly PermissionAuthorizer $auth,private readonly ProviderQuotaGuard $quota){} public function execute(array $input):array{$this->auth->authorize($this->context->userId(),$this->context->companyId(),'titan-maps-intelligence.provider-quota.read');return ['ok'=>true,'data'=>$this->quota->status((string)($input['provider']??'google-routes'))];}}

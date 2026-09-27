<?php
declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Tools;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;use App\Extensions\TitanMapsIntelligence\Services\DispatchScoringPolicyService;
final class ReadDispatchWeightsTool { public function __construct(private readonly AuthorisedCompanyContext $context,private readonly PermissionAuthorizer $auth,private readonly DispatchScoringPolicyService $policies){} public function execute(array $input):array{$this->auth->authorize($this->context->userId(),$this->context->companyId(),'titan-maps-intelligence.dispatch.weights.read');return ['ok'=>true,'data'=>$this->policies->resolve(isset($input['vertical'])?(string)$input['vertical']:null)];}}

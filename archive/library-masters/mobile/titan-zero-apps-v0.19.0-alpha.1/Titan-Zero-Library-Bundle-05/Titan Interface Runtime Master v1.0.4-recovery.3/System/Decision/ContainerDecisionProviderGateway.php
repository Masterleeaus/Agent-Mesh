<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Decision;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Decision\DecisionProviderContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Decision\DecisionProviderGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Registry\DecisionProviderDescriptor;

final readonly class ContainerDecisionProviderGateway implements DecisionProviderGatewayContract
{
    public function __construct(private object $container){ }
    public function fetch(DecisionProviderDescriptor $descriptor, InterfaceContext $context, array $criteria=[]):DecisionProviderResult
    {
        $binding=$descriptor->binding();
        if(!method_exists($this->container,'bound')||!method_exists($this->container,'make')||!$this->container->bound($binding))throw new DecisionProviderUnavailable("Decision provider {$descriptor->providerKey()} is not bound.");
        try{$provider=$this->container->make($binding);}catch(\Throwable $e){throw new DecisionProviderUnavailable("Decision provider {$descriptor->providerKey()} could not be resolved.",0,$e);}
        if(!$provider instanceof DecisionProviderContract)throw new DecisionProviderUnavailable("Decision provider {$descriptor->providerKey()} does not implement the required contract.");
        $result=$provider->fetch($context,$descriptor->providerKey(),$criteria);
        if($result->providerKey!==$descriptor->providerKey())throw new DecisionProviderUnavailable('Decision provider returned mismatched provider identity.');
        if((string)$result->companyId!==(string)$context->companyId||(string)$result->userId!==(string)$context->userId)throw new DecisionProviderUnavailable('Decision provider returned data for a different tenant or user.');
        return $result;
    }
}

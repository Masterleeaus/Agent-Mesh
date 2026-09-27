<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Onboarding;

use App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityProviderRegistry;

final class OnboardingReadinessService
{
    public function __construct(private readonly CapabilityProviderRegistry $providers){}

    public function aggregate(OnboardingPlan $plan, CapabilityExecutionContext $context): array
    {
        if($plan->companyId!==$context->companyId)throw new \RuntimeException('Onboarding readiness company_id mismatch.');
        $required=[];
        foreach($plan->actions as$action){if($action->group==='activation')continue;foreach($action->readinessRequirements as$key)$required[$key]=true;}
        $states=[];$overall='ready';
        foreach(['crm','builder','chatbot','connect','titan_ai','mobile'] as$key){
            if(!isset($required[$key])){$states[$key]=['status'=>'not_required','reason'=>null,'details'=>[]];continue;}
            $provider=$this->providers->provider($key);
            if($provider===null){$states[$key]=['status'=>'blocked','reason'=>'Capability provider is not registered.','details'=>[]];$overall='blocked';continue;}
            $state=method_exists($provider,'readiness')?$provider->readiness($context):['status'=>'warning','reason'=>'Provider does not expose a readiness contract.','details'=>[]];
            $status=(string)($state['status']??'warning');if(!in_array($status,['ready','warning','blocked','not_required'],true))$status='warning';
            $states[$key]=array_replace(['status'=>$status,'reason'=>null,'details'=>[]],$state,['status'=>$status]);
            if($status==='blocked')$overall='blocked';elseif($status==='warning'&&$overall==='ready')$overall='warning';
        }
        return ['status'=>$overall,'company_id'=>$context->companyId,'plan_id'=>$plan->id,'providers'=>$states];
    }
}

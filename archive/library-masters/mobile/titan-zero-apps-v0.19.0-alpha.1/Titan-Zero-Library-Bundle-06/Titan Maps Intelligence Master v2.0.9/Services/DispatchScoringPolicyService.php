<?php
declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Services;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Models\MapDispatchScoringPolicy;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
final class DispatchScoringPolicyService
{
    public function __construct(private readonly AuthorisedCompanyContext $context,private readonly MapsConfiguration $configuration,private readonly DispatchScoringPolicyValidator $validator){}
    public function resolve(?string $vertical=null): array
    {
        $q=MapDispatchScoringPolicy::query()->forCompany($this->context->companyId())->where('enabled',true);
        $policy=null;
        if($vertical!==null&&trim($vertical)!=='') $policy=(clone $q)->where('vertical',trim($vertical))->latest('updated_at')->first();
        $policy ??=(clone $q)->whereNull('vertical')->latest('updated_at')->first();
        $weights=$policy?->weights ?? $this->configuration->dispatchWeights();
        return ['weights'=>$this->validator->validate((array)$weights),'policy_id'=>$policy?->id,'policy_version'=>$policy?->policy_version ?? 'config-default','vertical'=>$policy?->vertical];
    }
    public function update(array $weights,?string $vertical,string $policyVersion): MapDispatchScoringPolicy
    {
        $weights=$this->validator->validate($weights); $vertical=$vertical!==null&&trim($vertical)!==''?trim($vertical):null;
        return MapDispatchScoringPolicy::query()->updateOrCreate(['company_id'=>$this->context->companyId(),'vertical'=>$vertical],[
            'policy_version'=>$policyVersion,'weights'=>$weights,'temporal_settings'=>[],'enabled'=>true,'updated_by_user_id'=>$this->context->userId(),'metadata'=>['source'=>'governed_maps_policy'],
        ]);
    }
}

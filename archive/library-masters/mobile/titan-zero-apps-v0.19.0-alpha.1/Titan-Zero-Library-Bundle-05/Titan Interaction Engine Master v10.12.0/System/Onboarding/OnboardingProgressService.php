<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Onboarding;

use App\Extensions\InteractionEngine\System\Onboarding\Storage\OnboardingExecutionLedgerInterface;

final class OnboardingProgressService
{
    public function __construct(private readonly OnboardingExecutionLedgerInterface $ledger) {}

    public function build(OnboardingPlan $plan, array $readiness): array
    {
        $sections=[];$complete=0;$total=count($plan->actions);$activationState='not_started';
        foreach($plan->actions as $action){
            $result=$this->ledger->result($plan->companyId,$plan->id,$action->id);$providerState=(string)($readiness['providers'][$action->provider]['status']??($action->provider==='interaction'?'ready':'blocked'));
            $status=$this->actionStatus($result,$providerState);
            if(in_array($status,['complete'],true))$complete++;
            if($action->group==='activation'){$activationState=$status;continue;}
            $sections[$action->group]=['provider'=>$action->provider,'capability'=>$action->capability,'status'=>$status];
        }
        $providers=(array)($readiness['providers']??[]);
        $mobile=$providers['mobile']??['status'=>'not_required'];$builder=$providers['builder']??['status'=>'not_required'];
        return [
            'overall_percentage'=>$total>0?(int)round(($complete/$total)*100):100,
            'sections'=>$sections,
            'connections'=>['connect'=>$providers['connect']??['status'=>'not_required']],
            'applications'=>[
                'hub'=>$this->combineReadiness($builder,$mobile),
                'go'=>$this->combineReadiness($builder,$mobile),
                'command'=>$this->combineReadiness($builder,$mobile),
            ],
            'chatbot'=>$providers['chatbot']??['status'=>'not_required'],
            'crm'=>$providers['crm']??['status'=>'not_required'],
            'activation'=>['status'=>$activationState,'readiness'=>$readiness['status']??'blocked'],
        ];
    }

    private function actionStatus(?array $result,string $providerState):string
    {
        $status=(string)($result['status']??'');
        if(in_array($status,['executed','already_executed'],true))return'complete';
        if(in_array($status,['pending_approval','offline_deferred'],true))return'in_progress';
        if(in_array($status,['failed','blocked_dependency','unavailable','unauthorized','validation_failed','conflict'],true))return'blocked';
        if($providerState==='blocked')return'blocked';
        if($providerState==='warning')return'needs_review';
        if($providerState==='ready')return'needs_review';
        return'not_started';
    }

    private function combineReadiness(array $builder,array $mobile):array
    {
        $states=[(string)($builder['status']??'not_required'),(string)($mobile['status']??'not_required')];
        $status=in_array('blocked',$states,true)?'blocked':(in_array('warning',$states,true)?'warning':(in_array('ready',$states,true)?'ready':'not_required'));
        return ['status'=>$status,'builder'=>$builder,'mobile'=>$mobile];
    }
}

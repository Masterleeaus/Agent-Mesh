<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Presentation;
use App\Extensions\InteractionEngine\System\Wizard\WizardSession;
final class GeneratedUiPresenter
{
    public function present(WizardSession$session):array
    {
        $step=$session->currentStep()??[];$fields=array_values((array)($step['fields']??[]));$field=$fields[0]??[];$count=$session->definition->stepCount();$index=min($session->stepIndex,$count);
        $offline=(array)$session->definition->offline;$mode=(string)($offline['mode']??($offline['enabled']??false?'offline_queueable':'online_required'));
        if(!in_array($mode,['offline_local','offline_queueable','online_required'],true))$mode=($offline['enabled']??false)?'offline_queueable':'online_required';
        return [
            'interaction_id'=>$session->id,'wizard_id'=>$session->definition->id,'session_id'=>$session->id,'step_id'=>$step['id']??null,
            'title'=>$step['title']??$session->definition->name,'prompt'=>$step['prompt']??$field['label']??$step['title']??null,'description'=>$step['description']??null,
            'input_type'=>count($fields)>1?'group':($field['type']??null),'options'=>$field['options']??[],'validation'=>$this->validation($fields),
            'ui_hint'=>$step['ui_hint']??$field['ui_hint']??$this->uiHint($field),'help_text'=>$step['help_text']??$field['help_text']??null,
            'progress'=>['step'=>$index+($session->complete()?0:1),'total'=>$count,'percentage'=>$count>0?(int)round(min($count,$index)/$count*100):100,'status'=>$session->status],
            'actions'=>$session->complete()?[]:['submit','pause'],'requires_online'=>$mode==='online_required','offline_mode'=>$mode,
            'authority_state'=>'governed','surface'=>$this->canonicalSurface((string)($session->context['source_surface']??$session->context['interface']??'zero')),'journey'=>$this->journeyForContext($session->context),'presentation_intent_schema'=>'titan.apps.presentation-intent.v1',
        ];
    }
    private function validation(array$fields):array{$out=[];foreach($fields as$f){$id=(string)($f['id']??'');if($id==='')continue;$out[$id]=['required'=>(bool)($f['required']??false),'type'=>$f['type']??'text','rules'=>$f['validation']??[]];}return$out;}
    private function canonicalSurface(string $surface):string{return match(strtolower(trim($surface))){'bos','command','owner','manager','business','onboarding','setup'=>'zero','field','worker','titan_go','titan-go'=>'go','customer','titan_hub','titan-hub'=>'hub',default=>in_array(strtolower(trim($surface)),['zero','go','hub'],true)?strtolower(trim($surface)):'zero'};}
    private function journey(string $journey):?string{return trim($journey)===''?null:(in_array(strtolower(trim($journey)),['setup','business_initial_onboarding','field_home_services_onboarding','field_home_services_onboarding_v1'],true)?'onboarding':strtolower(trim($journey)));}
    private function journeyForContext(array $context):?string{$journey=$this->journey((string)($context['journey']??''));if($journey!==null)return$journey;$legacy=strtolower(trim((string)($context['source_surface']??$context['interface']??'')));return in_array($legacy,['onboarding','setup','titan_onboarding','titan-onboarding'],true)?'onboarding':null;}
    private function uiHint(array$field):?string{return match((string)($field['type']??'')){'weekly_schedule'=>'weekly_schedule','map_radius'=>'map_radius','map_polygon'=>'map_polygon','multi_select'=>'choice_cards','file','file_collection'=>'evidence_upload','checklist_builder'=>'checklist','service_rule_matrix'=>'service_matrix',default=>null};}
}

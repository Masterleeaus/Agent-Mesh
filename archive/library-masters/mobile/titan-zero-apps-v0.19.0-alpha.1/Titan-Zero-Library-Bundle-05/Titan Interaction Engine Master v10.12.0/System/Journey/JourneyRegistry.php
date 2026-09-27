<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Journey;

final class JourneyRegistry
{
    /** @var array<string,JourneyDefinition> */ private array $journeys=[];
    public function __construct(){
        $this->register(new JourneyDefinition('onboarding','Business initial onboarding',['field_home_services_onboarding_v1'],['zero'],metadata:['profile'=>'field_home_services','legacy_ids'=>['business_initial_onboarding']]));
        $this->register(new JourneyDefinition('new_customer_onboarding','New customer onboarding',['new_customer_v1'],['hub','zero']));
        $this->register(new JourneyDefinition('service_booking','Service booking',['service_booking_v1'],['hub','zero']));
        $this->register(new JourneyDefinition('field_job_completion','Field job completion',['complete_job_v1'],['go','zero']));
    }
    public function register(JourneyDefinition $j):void{$this->journeys[$j->id]=$j;}
    public function has(string $id):bool{return isset($this->journeys[$this->canonicalId($id)]);}
    public function get(string $id):JourneyDefinition{$id=$this->canonicalId($id);if(!$this->has($id))throw new \RuntimeException("Journey '{$id}' is not registered.");return$this->journeys[$id];}
    /** @return array<string,JourneyDefinition> */ public function all():array{return$this->journeys;}
    /** @return list<JourneyDefinition> */ public function forSurface(string $surface):array{$surface=$this->canonicalSurface($surface);return array_values(array_filter($this->journeys,static fn(JourneyDefinition $j)=>in_array($surface,$j->surfaces,true)));}
    private function canonicalId(string $id):string{return in_array(strtolower(trim($id)),['business_initial_onboarding','field_home_services_onboarding'],true)?'onboarding':strtolower(trim($id));}
    private function canonicalSurface(string $surface):string{return match(strtolower(trim($surface))){'bos','command','owner','manager','business','onboarding','setup'=>'zero','field','worker'=>'go','customer'=>'hub',default=>strtolower(trim($surface))};}
}

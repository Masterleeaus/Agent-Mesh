<?php
declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Capabilities;
final class CapabilityRouter
{
    public function __construct(private readonly CapabilityProviderRegistry $providers, private readonly CapabilityAliasRegistry $aliases){}
    public function canonical(string $capability):string{return $this->aliases->canonical($capability);}
    public function descriptor(string $capability):?CapabilityDescriptor{return $this->providers->descriptor($this->canonical($capability));}
    /** @return array<string,CapabilityDescriptor> */ public function descriptors():array{return $this->providers->descriptors();}
    public function status(string $capability, ?CapabilityExecutionContext $context=null):array
    {
        $canonical=$this->canonical($capability);$descriptor=$this->providers->descriptor($canonical);$provider=$this->providers->providerFor($canonical);
        if(!$descriptor||!$provider)return ['capability'=>$capability,'canonical_capability'=>$canonical,'provider'=>$descriptor?->provider??'none','declared'=>(bool)$descriptor,'supported'=>false,'availability'=>'unavailable','reason'=>$descriptor?'Provider is not registered.':'Capability is not declared by any provider.','alias'=>$this->aliases->isAlias($capability)];
        $available=$context!==null?$provider->available($canonical,$context):$provider->supports($canonical);
        return ['capability'=>$capability,'canonical_capability'=>$canonical,'provider'=>$provider->providerKey(),'declared'=>true,'supported'=>$provider->supports($canonical),'availability'=>$available?'available':'unavailable','reason'=>$available?null:($descriptor->reason??'Provider is unavailable.'),'alias'=>$this->aliases->isAlias($capability),'descriptor'=>$descriptor->withAvailability($available,$available?null:($descriptor->reason??'Provider is unavailable.'))->toArray()];
    }
    public function execute(string $capability,array $payload,CapabilityExecutionContext $context):CapabilityResult
    {
        $canonical=$this->canonical($capability);$provider=$this->providers->providerFor($canonical);$descriptor=$this->providers->descriptor($canonical);
        if(!$provider||!$descriptor)return CapabilityResult::unavailable($canonical,$descriptor?->provider??'none','No capability provider is registered.');
        if(!$provider->supports($canonical))return CapabilityResult::unavailable($canonical,$provider->providerKey(),'Provider does not support this capability.');
        if(!$provider->available($canonical,$context))return CapabilityResult::unavailable($canonical,$provider->providerKey(),$descriptor->reason??'Provider is unavailable for the active company.');
        try{return $provider->execute($canonical,$payload,$context);}catch(\InvalidArgumentException $e){return new CapabilityResult('validation_failed',$canonical,$provider->providerKey(),null,$e->getMessage());}catch(\Throwable $e){return new CapabilityResult('failed',$canonical,$provider->providerKey(),null,'Owning extension execution failed.', ['error_class'=>$e::class]);}
    }
}

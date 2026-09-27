<?php
declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Capabilities;
final class CapabilityProviderRegistry
{
    /** @var array<string,CapabilityProviderInterface> */ private array $providers=[];
    /** @var array<string,string> */ private array $owners=[];
    public function register(CapabilityProviderInterface $provider): void
    {
        $key=$provider->providerKey(); if(trim($key)==='') throw new \InvalidArgumentException('Provider key cannot be empty.');
        $this->providers[$key]=$provider;
        foreach($provider->descriptors() as $cap=>$descriptor){
            if(!$descriptor instanceof CapabilityDescriptor) throw new \InvalidArgumentException("Provider $key returned invalid descriptor for $cap");
            if(isset($this->owners[$cap]) && $this->owners[$cap]!==$key) throw new \RuntimeException("Capability $cap already owned by {$this->owners[$cap]}");
            $this->owners[$cap]=$key;
        }
    }
    public function provider(string $key): ?CapabilityProviderInterface{return $this->providers[$key]??null;}
    public function providerFor(string $capability): ?CapabilityProviderInterface{$key=$this->owners[$capability]??null;return $key!==null?($this->providers[$key]??null):null;}
    public function descriptor(string $capability): ?CapabilityDescriptor{$p=$this->providerFor($capability);return $p?($p->descriptors()[$capability]??null):null;}
    /** @return array<string,CapabilityProviderInterface> */ public function all():array{return $this->providers;}
    /** @return array<string,CapabilityDescriptor> */ public function descriptors():array{ $out=[]; foreach($this->providers as $provider){ foreach($provider->descriptors() as $capability=>$descriptor)$out[$capability]=$descriptor; } ksort($out); return $out; }
    /** @return list<string> */ public function providerKeys():array{$k=array_keys($this->providers);sort($k);return $k;}
}

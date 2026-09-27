<?php
declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Capabilities;
final readonly class CapabilityResult
{
    public const STATUSES=['executed','prepared','pending_approval','unavailable','unauthorized','validation_failed','conflict','offline_deferred','failed','blocked_dependency'];
    public function __construct(public string $status, public string $capability, public string $provider='none', public mixed $data=null, public ?string $reason=null, public array $metadata=[])
    { if(!in_array($status,self::STATUSES,true)) throw new \InvalidArgumentException("Invalid capability result status: $status"); }
    public static function executed(string $capability,string $provider,mixed $data=null,array $metadata=[]):self{return new self('executed',$capability,$provider,$data,null,$metadata);}
    public static function prepared(string $capability,string $provider,mixed $data=null):self{return new self('prepared',$capability,$provider,$data);}
    public static function unavailable(string $capability,string $provider='none',?string $reason=null):self{return new self('unavailable',$capability,$provider,null,$reason??'Capability provider is unavailable.');}
    public static function unauthorized(string $capability,string $provider='none',?string $reason=null):self{return new self('unauthorized',$capability,$provider,null,$reason??'Capability is not authorized.');}
    public static function failed(string $capability,string $provider,?string $reason=null):self{return new self('failed',$capability,$provider,null,$reason??'Capability execution failed.');}
    public function toArray():array{return ['status'=>$this->status,'capability'=>$this->capability,'provider'=>$this->provider,'data'=>$this->data,'reason'=>$this->reason,'metadata'=>$this->metadata];}
}

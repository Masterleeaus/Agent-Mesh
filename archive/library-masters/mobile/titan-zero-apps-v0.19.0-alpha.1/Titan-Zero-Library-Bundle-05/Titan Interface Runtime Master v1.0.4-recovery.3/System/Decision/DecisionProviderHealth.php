<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Decision;

final readonly class DecisionProviderHealth implements \JsonSerializable
{
    public const STATUSES=['healthy','degraded','unavailable'];
    public function __construct(public string $providerKey, public string $status, public ?string $message=null)
    {
        if($providerKey===''||strlen($providerKey)>200||preg_match('/[\x00-\x1F\x7F]/',$providerKey))throw new \InvalidArgumentException('Decision provider health key is invalid.');
        if(!in_array($status,self::STATUSES,true))throw new \InvalidArgumentException('Decision provider health status is invalid.');
        if($message!==null&&strlen($message)>500)throw new \InvalidArgumentException('Decision provider health message is too long.');
    }
    public function degraded():bool{return $this->status!=='healthy';}
    public function jsonSerialize():array{return ['provider_key'=>$this->providerKey,'status'=>$this->status,'message'=>$this->message];}
}

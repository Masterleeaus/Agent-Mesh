<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Contracts;

final readonly class InteractionContext
{
    public function __construct(public string $companyId, public string $actorId, public string $surface, public ?string $journey=null, public ?string $deviceId=null, public array $roles=[], public array $capabilities=[], public array $metadata=[])
    {
        if(trim($companyId)===''||trim($actorId)==='') throw new \InvalidArgumentException('InteractionContext requires company and actor identity.');
        if(!in_array($surface,['zero','go','hub'],true)) throw new \InvalidArgumentException('InteractionContext surface must be zero, go or hub.');
    }
    public function toArray():array{return ['company_id'=>$this->companyId,'actor_id'=>$this->actorId,'surface'=>$this->surface,'journey'=>$this->journey,'device_id'=>$this->deviceId,'roles'=>$this->roles,'capabilities'=>$this->capabilities,'metadata'=>$this->metadata];}
}

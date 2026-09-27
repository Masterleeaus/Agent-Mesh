<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Decision;

final readonly class DecisionProviderResult implements \JsonSerializable
{
    /** @param array<string,mixed> $payload @param array<string,mixed> $provenance */
    public function __construct(
        public string $providerKey,
        public string $companyId,
        public string $userId,
        public DecisionProviderHealth $health,
        public array $payload,
        public array $provenance,
    ) {
        if($providerKey!==$health->providerKey)throw new \InvalidArgumentException('Decision provider result health identity mismatch.');
        if($companyId===''||$userId==='')throw new \InvalidArgumentException('Decision provider result requires tenant and user identity.');
    }
    public function jsonSerialize():array{return ['provider_key'=>$this->providerKey,'company_id'=>$this->companyId,'company_id'=>$this->companyId,'user_id'=>$this->userId,'health'=>$this->health->jsonSerialize(),'payload'=>$this->payload,'provenance'=>$this->provenance];}
}

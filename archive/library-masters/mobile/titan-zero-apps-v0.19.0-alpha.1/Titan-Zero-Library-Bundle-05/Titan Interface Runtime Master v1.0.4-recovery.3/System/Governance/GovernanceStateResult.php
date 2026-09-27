<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Governance;

final readonly class GovernanceStateResult implements \JsonSerializable
{
    /** @param array<string,mixed> $payload @param array<string,mixed> $provenance */
    public function __construct(
        public string $providerKey,
        public string $companyId,
        public string $userId,
        public GovernanceProviderHealth $health,
        public array $payload,
        public array $provenance = [],
    ) {
        if ($providerKey === '' || strlen($providerKey) > 160) throw new \InvalidArgumentException('Governance provider key is invalid.');
        if ($companyId === '' || $userId === '') throw new \InvalidArgumentException('Governance results require explicit tenant and user identity.');
        if ($health->providerKey !== $providerKey) throw new \InvalidArgumentException('Governance health provider key does not match result provider key.');
    }

    public function jsonSerialize(): array
    {
        return [
            'provider_key'=>$this->providerKey,
            'company_id'=>$this->companyId,'company_id'=>$this->companyId,
            'user_id'=>$this->userId,
            'health'=>$this->health->jsonSerialize(),
            'payload'=>$this->payload,
            'provenance'=>$this->provenance,
        ];
    }
}

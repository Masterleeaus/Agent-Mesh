<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Governance;

final readonly class GovernanceProviderHealth implements \JsonSerializable
{
    private const STATUSES = ['healthy','degraded','unavailable'];

    public function __construct(
        public string $providerKey,
        public string $status,
        public string $message = '',
    ) {
        if ($providerKey === '' || strlen($providerKey) > 160) throw new \InvalidArgumentException('Governance provider key is invalid.');
        if (! in_array($status, self::STATUSES, true)) throw new \InvalidArgumentException('Governance provider health status is invalid.');
        if (strlen($message) > 500) throw new \InvalidArgumentException('Governance provider health message is too long.');
    }

    public function degraded(): bool { return $this->status !== 'healthy'; }

    public function jsonSerialize(): array
    {
        return ['provider_key'=>$this->providerKey,'status'=>$this->status,'message'=>$this->message];
    }
}

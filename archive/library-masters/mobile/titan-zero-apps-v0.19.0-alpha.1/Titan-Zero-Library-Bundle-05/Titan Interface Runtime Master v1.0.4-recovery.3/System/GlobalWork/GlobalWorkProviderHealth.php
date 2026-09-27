<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\GlobalWork;

final readonly class GlobalWorkProviderHealth implements \JsonSerializable
{
    public const STATUSES = ['healthy', 'degraded', 'unavailable'];

    public function __construct(
        public string $providerKey,
        public string $status,
        public ?string $message = null,
        public int $itemCount = 0,
    ) {
        if ($providerKey === '' || strlen($providerKey) > 200 || preg_match('/[\x00-\x1F\x7F]/', $providerKey)) {
            throw new \InvalidArgumentException('Global work provider health key is invalid.');
        }
        if (! in_array($status, self::STATUSES, true)) throw new \InvalidArgumentException('Global work provider health status is invalid.');
        if ($message !== null && strlen($message) > 500) throw new \InvalidArgumentException('Global work provider health message is too long.');
        if ($itemCount < 0) throw new \InvalidArgumentException('Global work provider item count cannot be negative.');
    }

    public function degraded(): bool
    {
        return $this->status !== 'healthy';
    }

    /** @return array<string,mixed> */
    public function jsonSerialize(): array
    {
        return ['provider_key'=>$this->providerKey,'status'=>$this->status,'message'=>$this->message,'item_count'=>$this->itemCount];
    }
}

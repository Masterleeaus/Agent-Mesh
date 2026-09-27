<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Support;

use App\Extensions\TitanAppsCore\System\Contracts\AppSurface;
use InvalidArgumentException;

final readonly class OfflineCapabilityIntent
{
    /** @param array<string,mixed> $payload */
    public function __construct(
        public string $intentId,
        public AppSurface $surface,
        public int $companyId,
        public int $actorId,
        public string $capability,
        public string $idempotencyKey,
        public array $payload = [],
        public ?string $createdAt = null,
    ) {
        if (trim($intentId) === '') throw new InvalidArgumentException('Offline intent id is required.');
        if ($companyId < 1 || $actorId < 1) throw new InvalidArgumentException('Offline intent requires company and actor.');
        if (trim($capability) === '') throw new InvalidArgumentException('Capability id is required.');
        if (trim($idempotencyKey) === '') throw new InvalidArgumentException('Idempotency key is required.');
    }

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return [
            'intent_id'=>$this->intentId,
            'surface'=>$this->surface->value,
            'company_id'=>$this->companyId,
            'actor_id'=>$this->actorId,
            'capability'=>$this->capability,
            'idempotency_key'=>$this->idempotencyKey,
            'payload'=>$this->payload,
            'created_at'=>$this->createdAt,
        ];
    }
}

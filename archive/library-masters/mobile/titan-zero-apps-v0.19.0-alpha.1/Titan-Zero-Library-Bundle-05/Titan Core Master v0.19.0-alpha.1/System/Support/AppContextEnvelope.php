<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Support;

final readonly class AppContextEnvelope
{
    public function __construct(public AppContext $context) {}

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return [
            'surface'=>$this->context->surface->value,
            'company_id'=>$this->context->companyId,
            'actor_id'=>$this->context->actorId,
            'session_id'=>$this->context->sessionId,
            'attributes'=>$this->context->attributes,
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Capabilities\Contracts;

use App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext;

/**
 * Consumer-side gateway contract. Peer extensions bind an adapter to this
 * interface without exposing their persistence internals to Interaction Engine.
 */
interface ExternalCapabilityGatewayInterface
{
    /** @return list<string> */
    public function supportedCapabilities(): array;

    public function available(string $capability, CapabilityExecutionContext $context): bool;

    /**
     * Return a structured envelope with status from CapabilityResult::STATUSES.
     * No missing/empty status is interpreted as success.
     * @return array{status:string,data?:mixed,reason?:?string,metadata?:array}
     */
    public function execute(string $capability, array $payload, CapabilityExecutionContext $context): array;

    /** @return array{status:string,reason?:?string,details?:array} */
    public function readiness(CapabilityExecutionContext $context): array;
}

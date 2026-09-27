<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Capabilities\Providers;

use App\Extensions\InteractionEngine\System\Capabilities\CapabilityDescriptor;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityProviderInterface;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityResult;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\ExternalCapabilityGatewayInterface;

abstract class AbstractGatewayCapabilityProvider implements CapabilityProviderInterface
{
    /** @param array<string,CapabilityDescriptor> $descriptors */
    public function __construct(
        private readonly array $descriptors,
        protected readonly ?ExternalCapabilityGatewayInterface $gateway = null,
    ) {
    }

    public function descriptors(): array
    {
        return $this->descriptors;
    }

    public function supports(string $capability): bool
    {
        if (!isset($this->descriptors[$capability]) || $this->gateway === null) {
            return false;
        }
        return in_array($capability, $this->gateway->supportedCapabilities(), true);
    }

    public function available(string $capability, CapabilityExecutionContext $context): bool
    {
        return $this->supports($capability) && $this->gateway?->available($capability, $context) === true;
    }

    public function execute(string $capability, array $payload, CapabilityExecutionContext $context): CapabilityResult
    {
        if (!$this->available($capability, $context) || $this->gateway === null) {
            return CapabilityResult::unavailable($capability, $this->providerKey(), 'Owning extension gateway is not available for the active company.');
        }

        $trustedPayload = $payload;
        unset($trustedPayload['_context'], $trustedPayload['_approval']);
        $outcome = $this->gateway->execute($capability, $trustedPayload, $context);
        $status = (string) ($outcome['status'] ?? '');
        if (!in_array($status, CapabilityResult::STATUSES, true)) {
            return CapabilityResult::failed($capability, $this->providerKey(), 'Owning extension returned an invalid execution status.');
        }

        return new CapabilityResult(
            $status,
            $capability,
            $this->providerKey(),
            $outcome['data'] ?? null,
            isset($outcome['reason']) ? (string) $outcome['reason'] : null,
            (array) ($outcome['metadata'] ?? []),
        );
    }

    public function readiness(CapabilityExecutionContext $context): array
    {
        if ($this->gateway === null) {
            return ['status' => 'blocked', 'reason' => 'Owning extension gateway is not bound.', 'details' => []];
        }
        return $this->gateway->readiness($context);
    }
}

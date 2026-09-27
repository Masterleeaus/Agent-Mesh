<?php
declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Capabilities;
interface CapabilityProviderInterface
{
    public function providerKey(): string;
    /** @return array<string,CapabilityDescriptor> */
    public function descriptors(): array;
    public function supports(string $capability): bool;
    public function available(string $capability, CapabilityExecutionContext $context): bool;
    public function execute(string $capability, array $payload, CapabilityExecutionContext $context): CapabilityResult;
}

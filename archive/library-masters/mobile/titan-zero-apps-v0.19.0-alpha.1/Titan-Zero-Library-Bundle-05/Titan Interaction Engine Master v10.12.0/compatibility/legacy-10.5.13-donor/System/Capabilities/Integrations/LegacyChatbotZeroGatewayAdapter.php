<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Capabilities\Integrations;

use App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\ChatbotCapabilityGatewayInterface;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\ZeroExperienceCapabilityGatewayInterface;

/** Compatibility adapter only: translates canonical Zero experience capabilities to a legacy Chatbot gateway. */
final class LegacyChatbotZeroGatewayAdapter implements ZeroExperienceCapabilityGatewayInterface
{
    public function __construct(private readonly ChatbotCapabilityGatewayInterface $legacy) {}
    public function supportedCapabilities(): array { return array_values(array_map(fn(string $c): string => self::toCanonical($c), $this->legacy->supportedCapabilities())); }
    public function available(string $capability, CapabilityExecutionContext $context): bool { return $this->legacy->available(self::toLegacy($capability), $context); }
    public function execute(string $capability, array $payload, CapabilityExecutionContext $context): array { return $this->legacy->execute(self::toLegacy($capability), $payload, $context); }
    public function readiness(CapabilityExecutionContext $context): array { return $this->legacy->readiness($context); }
    private static function toCanonical(string $c): string { return str_starts_with($c, 'chatbot.') ? 'zero.'.substr($c, 8) : $c; }
    private static function toLegacy(string $c): string { return str_starts_with($c, 'zero.') ? 'chatbot.'.substr($c, 5) : $c; }
}

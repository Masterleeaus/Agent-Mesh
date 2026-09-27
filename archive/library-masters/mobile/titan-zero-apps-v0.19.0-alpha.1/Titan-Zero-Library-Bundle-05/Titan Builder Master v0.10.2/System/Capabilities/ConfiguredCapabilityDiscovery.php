<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Capabilities;

use App\Extensions\TitanBuilder\System\Contracts\CapabilityDiscovery;

/** Fail-closed fallback. Hosts may replace this binding with their capability router. */
final class ConfiguredCapabilityDiscovery implements CapabilityDiscovery
{
    private const BUILDER_NATIVE = [
        'builder.read','builder.edit','builder.publish','builder.assets.manage','builder.templates.manage',
        'builder.application.read','builder.application.create','builder.application.configure',
        'builder.preview','builder.validate','builder.readiness','builder.rollback','builder.theme.update',
    ];

    public function has(string $capability, ?int $companyId = null): bool
    {
        return in_array($capability, $this->available($companyId), true);
    }

    public function available(?int $companyId = null): array
    {
        $configured = array_values(array_filter((array) config('titan-builder.integrations.available_capabilities', []), 'is_string'));
        return array_values(array_unique([...self::BUILDER_NATIVE, ...$configured]));
    }
}

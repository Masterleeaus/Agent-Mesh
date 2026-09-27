<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Capabilities\Providers;

use App\Extensions\InteractionEngine\System\Capabilities\CapabilityDescriptor;

final class DescriptorFactory
{
    public static function read(string $capability, string $provider, string $family = 'business_operations', string $offline = 'online_required'): CapabilityDescriptor
    {
        return new CapabilityDescriptor($capability, $provider, 'read', 'low', 'user_only', false, $offline, true, [], [], false, [], [], false, 'Provider gateway required.', '1.0', $family);
    }

    public static function write(
        string $capability,
        string $provider,
        string $risk = 'medium',
        string $authority = 'approval_required',
        bool $approval = true,
        string $offline = 'online_required',
        string $family = 'business_operations',
        bool $freshAuth = false,
    ): CapabilityDescriptor {
        return new CapabilityDescriptor($capability, $provider, 'write', $risk, $authority, $approval, $offline, true, [], [], $freshAuth, [], [], false, 'Provider gateway required.', '1.0', $family);
    }
}

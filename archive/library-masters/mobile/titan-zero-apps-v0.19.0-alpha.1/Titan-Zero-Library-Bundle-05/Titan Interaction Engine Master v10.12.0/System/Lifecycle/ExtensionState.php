<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Lifecycle;

use App\Extensions\InteractionEngine\System\Settings\SettingsResolver;

final class ExtensionState
{
    public function __construct(private readonly ?SettingsResolver $settings = null) {}

    public function enabled(): bool
    {
        $default = function_exists('config') ? (bool) config('interaction-engine.enabled', true) : true;
        return $this->settings?->platformBool('enabled', $default) ?? $default;
    }
}

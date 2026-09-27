<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

use App\Extensions\TitanAppsCore\System\Contracts\AppSurface;
use App\Extensions\TitanAppsCore\System\Support\AppRegistrationDescriptor;

final class TitanAppsApplicationRegistry
{
    /** @var array<string,AppRegistrationDescriptor> */
    private array $apps = [];

    public function __construct()
    {
        foreach ((array) config('titan-apps-core.applications', []) as $surfaceId => $definition) {
            $surface = AppSurface::resolve((string) $surfaceId);
            $this->apps[$surface->value] = new AppRegistrationDescriptor(
                $surface,
                (string) ($definition['app_id'] ?? 'titan-apps-'.$surface->value),
                (string) ($definition['display_name'] ?? ('Titan '.ucfirst($surface->value))),
                (string) ($definition['interface_mount'] ?? ($surface->value.'-workspace')),
                (bool) ($definition['pwa'] ?? true),
                (bool) ($definition['offline_capable'] ?? true),
                array_values(array_unique(array_map('strval', (array) ($definition['input_modes'] ?? ['touch'])))),
            );
        }
    }

    public function get(string|AppSurface $surface): AppRegistrationDescriptor
    {
        $surface = $surface instanceof AppSurface ? $surface : AppSurface::resolve($surface);
        return $this->apps[$surface->value]
            ?? throw new \LogicException('Titan Apps application is not registered: '.$surface->value);
    }

    /** @return array<string,array<string,mixed>> */
    public function catalogue(): array
    {
        $rows = [];
        foreach ($this->apps as $surface => $app) $rows[$surface] = $app->toArray();
        return $rows;
    }

    /** @return list<string> */
    public function validate(): array
    {
        $errors = [];
        foreach (AppSurface::cases() as $surface) {
            if (!isset($this->apps[$surface->value])) {
                $errors[] = 'Missing canonical application registration: '.$surface->value;
                continue;
            }
            $row = $this->apps[$surface->value]->toArray();
            if (trim((string) $row['interface_mount']) === '') $errors[] = 'Application mount is empty: '.$surface->value;
        }
        return $errors;
    }
}

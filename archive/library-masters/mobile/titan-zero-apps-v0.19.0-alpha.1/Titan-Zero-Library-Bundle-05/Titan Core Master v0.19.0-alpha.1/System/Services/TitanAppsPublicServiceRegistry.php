<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

use App\Extensions\TitanAppsCore\System\Contracts\PlatformAccessibleServiceRegistry;
use App\Extensions\TitanAppsCore\System\Support\AppPublicServiceDescriptor;

final class TitanAppsPublicServiceRegistry implements PlatformAccessibleServiceRegistry
{
    /** @var array<string,AppPublicServiceDescriptor> */
    private array $services = [];

    public function __construct()
    {
        foreach ((array) config('titan-apps-core.public_services', []) as $id => $definition) {
            $this->services[(string) $id] = new AppPublicServiceDescriptor(
                (string) $id,
                (string) ($definition['owner'] ?? 'Titan Apps'),
                (bool) ($definition['platform_accessible'] ?? false),
                array_values(array_filter(array_map('strval', (array) ($definition['contracts'] ?? [])))),
            );
        }
    }

    public function get(string $id): ?AppPublicServiceDescriptor
    {
        return $this->services[$id] ?? null;
    }

    /** @return list<AppPublicServiceDescriptor> */
    public function all(): array
    {
        return array_values($this->services);
    }

    /** @return list<AppPublicServiceDescriptor> */
    public function platformAccessible(): array
    {
        return array_values(array_filter(
            $this->all(),
            static fn(AppPublicServiceDescriptor $service): bool => $service->platformAccessible()
        ));
    }

    /** @return array<string,array<string,mixed>> */
    public function catalogue(): array
    {
        $rows = [];
        foreach ($this->services as $id => $service) {
            $row = $service->toArray();
            $row['resolved_contract'] = null;
            foreach ($service->contractCandidates() as $contract) {
                if (interface_exists($contract) || class_exists($contract)) {
                    $row['resolved_contract'] = $contract;
                    break;
                }
            }
            $rows[$id] = $row;
        }
        return $rows;
    }
}

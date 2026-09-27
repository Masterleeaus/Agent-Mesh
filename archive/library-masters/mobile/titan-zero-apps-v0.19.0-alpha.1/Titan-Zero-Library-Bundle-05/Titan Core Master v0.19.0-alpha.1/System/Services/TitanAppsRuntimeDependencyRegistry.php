<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

use App\Extensions\TitanAppsCore\System\Support\AppDependencyDescriptor;

final class TitanAppsRuntimeDependencyRegistry
{
    /** @var array<string,AppDependencyDescriptor> */
    private array $dependencies = [];

    public function __construct()
    {
        foreach ((array) config('titan-apps-core.runtime_dependencies', []) as $id => $definition) {
            $this->dependencies[(string) $id] = new AppDependencyDescriptor(
                (string) $id,
                (bool) ($definition['required'] ?? true),
                array_values(array_filter(array_map('strval', (array) ($definition['contracts'] ?? [])))),
            );
        }
    }

    public function get(string $id): ?AppDependencyDescriptor
    {
        return $this->dependencies[$id] ?? null;
    }

    /** @return list<AppDependencyDescriptor> */
    public function all(): array
    {
        return array_values($this->dependencies);
    }

    /** @return array<string,array{id:string,required:bool,available:bool,resolved_contract:?string,contracts:list<string>}> */
    public function readiness(): array
    {
        $result = [];
        foreach ($this->dependencies as $id => $dependency) {
            $resolved = null;
            foreach ($dependency->contractCandidates() as $contract) {
                if (interface_exists($contract) || class_exists($contract)) {
                    $resolved = $contract;
                    break;
                }
            }
            $result[$id] = [
                'id'=>$id,
                'required'=>$dependency->required(),
                'available'=>$resolved !== null,
                'resolved_contract'=>$resolved,
                'contracts'=>$dependency->contractCandidates(),
            ];
        }
        return $result;
    }

    /** @return list<string> */
    public function missingRequired(): array
    {
        return array_values(array_map(
            static fn(array $row): string => $row['id'],
            array_filter($this->readiness(), static fn(array $row): bool => $row['required'] && ! $row['available'])
        ));
    }
}

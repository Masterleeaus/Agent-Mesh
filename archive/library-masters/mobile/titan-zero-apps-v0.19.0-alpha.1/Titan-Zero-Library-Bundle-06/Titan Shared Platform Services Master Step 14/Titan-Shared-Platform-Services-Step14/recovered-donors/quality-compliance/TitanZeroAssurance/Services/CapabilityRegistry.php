<?php

declare(strict_types=1);

namespace Modules\TitanZeroAssurance\Services;

use LogicException;
use Modules\TitanZeroAssurance\ValueObjects\CapabilityDefinition;

final class CapabilityRegistry
{
    /** @var array<string, array{module:string,definition:CapabilityDefinition}> */
    private array $capabilities = [];

    public function register(string $module, CapabilityDefinition $definition): void
    {
        $existing = $this->capabilities[$definition->key] ?? null;
        if ($existing !== null) {
            if ($existing['module'] === $module && $existing['definition']->toArray() === $definition->toArray()) {
                return;
            }
            throw new LogicException('Capability ' . $definition->key . ' is already registered with a conflicting definition.');
        }

        $this->capabilities[$definition->key] = ['module' => $module, 'definition' => $definition];
    }

    /** @return array<string, mixed>|null */
    public function get(string $key): ?array
    {
        $entry = $this->capabilities[$key] ?? null;
        if ($entry === null) {
            return null;
        }

        return ['module' => $entry['module']] + $entry['definition']->toArray();
    }

    /** @return list<array<string, mixed>> */
    public function all(): array
    {
        return array_values(array_map(
            static fn (array $entry): array => ['module' => $entry['module']] + $entry['definition']->toArray(),
            $this->capabilities,
        ));
    }

    /** @param list<array<string, mixed>> $definitions */
    public function registerModuleFromArray(string $module, array $definitions): void
    {
        foreach ($definitions as $definition) {
            $this->register($module, new CapabilityDefinition(
                key: (string) ($definition['key'] ?? ''),
                label: (string) ($definition['label'] ?? ''),
                risk: (string) ($definition['risk'] ?? 'low'),
                handler: (string) ($definition['handler'] ?? ''),
                requiredPermissions: array_values($definition['required_permissions'] ?? $definition['requires'] ?? []),
            ));
        }
    }
}

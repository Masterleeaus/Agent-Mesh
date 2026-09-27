<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\DomainRegistryContract;

final class InMemoryDomainRegistry implements DomainRegistryContract
{
    private DomainRegistrySnapshot $current;

    public function __construct()
    {
        $this->current = new DomainRegistrySnapshot();
    }

    public function rebuild(array $contributions): DomainRegistrySnapshot
    {
        ksort($contributions, SORT_STRING);
        $candidates = [];
        $rejected = [];

        foreach ($contributions as $extensionKey => $contribution) {
            try {
                $descriptor = $this->unwrapDescriptor($contribution);
                $domains = $descriptor['domains'] ?? null;
                if (! is_array($domains) || ! array_is_list($domains)) {
                    throw new \InvalidArgumentException('domains must be a list.');
                }

                $built = [];
                foreach ($domains as $domain) {
                    if (! is_array($domain) || array_is_list($domain)) throw new \InvalidArgumentException('domain entries must be objects.');
                    $built[] = DomainDescriptor::fromArray((string) $extensionKey, $domain);
                }
                foreach ($built as $domain) $candidates[$domain->key][] = $domain;
            } catch (\Throwable $e) {
                $rejected[(string) $extensionKey][] = $e->getMessage();
            }
        }

        $collisions = [];
        $active = [];
        foreach ($candidates as $key => $owners) {
            if (count($owners) !== 1) {
                $ownerKeys = array_map(static fn (DomainDescriptor $domain): string => $domain->extensionKey, $owners);
                sort($ownerKeys, SORT_STRING);
                $collisions[$key] = array_values(array_unique($ownerKeys));
                continue;
            }
            $active[$key] = $owners[0];
        }

        uasort($active, static function (DomainDescriptor $a, DomainDescriptor $b): int {
            return [$a->priority, strtolower($a->label), $a->key, $a->extensionKey]
                <=> [$b->priority, strtolower($b->label), $b->key, $b->extensionKey];
        });
        ksort($collisions, SORT_STRING);
        ksort($rejected, SORT_STRING);

        return $this->current = new DomainRegistrySnapshot($active, $collisions, $rejected);
    }

    public function snapshot(): DomainRegistrySnapshot
    {
        return $this->current;
    }

    public function all(): array
    {
        return $this->current->domains;
    }

    public function get(string $domainKey): ?DomainDescriptor
    {
        return $this->current->domains[$domainKey] ?? null;
    }

    public function visibleFor(string $productSurface): array
    {
        $visible = [];
        foreach ($this->current->domains as $key => $domain) {
            if ($domain->visibleOn($productSurface)) $visible[$key] = $domain;
        }
        return $visible;
    }

    /** @param array<string,mixed> $contribution @return array<string,mixed> */
    private function unwrapDescriptor(array $contribution): array
    {
        $descriptor = $contribution['descriptor'] ?? $contribution;
        if (! is_array($descriptor) || array_is_list($descriptor)) throw new \InvalidArgumentException('contribution descriptor must be an object.');
        return $descriptor;
    }
}

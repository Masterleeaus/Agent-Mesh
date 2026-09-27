<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\FacetRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;

final class InMemoryFacetRegistry implements FacetRegistryContract
{
    private FacetRegistrySnapshot $current;

    public function __construct(private readonly ObjectRegistryContract $objects)
    {
        $this->current = new FacetRegistrySnapshot();
    }

    public function rebuild(array $contributions): FacetRegistrySnapshot
    {
        ksort($contributions, SORT_STRING);
        $candidates = [];
        $byContributor = [];
        $rejected = [];

        foreach ($contributions as $extensionKey => $contribution) {
            try {
                $descriptor = $this->unwrapDescriptor($contribution);
                $items = $descriptor['facets'] ?? null;
                if (! is_array($items) || ! array_is_list($items)) throw new \InvalidArgumentException('facets must be a list.');
                $built = [];
                foreach ($items as $item) {
                    if (! is_array($item) || array_is_list($item)) throw new \InvalidArgumentException('facet entries must be objects.');
                    $built[] = FacetDescriptor::fromArray((string) $extensionKey, $item);
                }
                foreach ($built as $facet) {
                    $candidates[$facet->key][] = $facet;
                    $byContributor[(string) $extensionKey][] = $facet->key;
                }
            } catch (\Throwable $e) {
                $rejected[(string) $extensionKey][] = $e->getMessage();
            }
        }

        $collisions = [];
        $active = [];
        foreach ($candidates as $key => $owners) {
            if (count($owners) !== 1) {
                $ownerKeys = array_map(static fn (FacetDescriptor $facet): string => $facet->extensionKey, $owners);
                sort($ownerKeys, SORT_STRING);
                $collisions[$key] = array_values(array_unique($ownerKeys));
                continue;
            }
            $active[$key] = $owners[0];
        }

        $knownObjects = $this->objects->all();
        $contributorsToReject = [];
        foreach ($active as $facet) {
            foreach ($facet->appliesTo as $objectKey) {
                if (! isset($knownObjects[$objectKey])) {
                    $contributorsToReject[$facet->extensionKey][] = "facet '{$facet->key}' applies_to unknown or unavailable object '{$objectKey}'";
                }
            }
        }
        foreach ($contributorsToReject as $extensionKey => $messages) {
            foreach (array_unique($messages) as $message) $rejected[$extensionKey][] = $message;
            foreach ($byContributor[$extensionKey] ?? [] as $key) unset($active[$key]);
        }

        $byObject = [];
        foreach ($active as $facet) {
            foreach ($facet->appliesTo as $objectKey) $byObject[$objectKey][] = $facet->key;
        }
        foreach ($byObject as $objectKey => &$facetKeys) {
            usort($facetKeys, function (string $left, string $right) use ($active): int {
                $rank = $active[$left]->kindRank() <=> $active[$right]->kindRank();
                return $rank !== 0 ? $rank : strcmp($left, $right);
            });
        }
        unset($facetKeys);

        ksort($active, SORT_STRING);
        ksort($byObject, SORT_STRING);
        ksort($collisions, SORT_STRING);
        foreach ($rejected as &$messages) $messages = array_values(array_unique($messages));
        unset($messages);
        ksort($rejected, SORT_STRING);

        return $this->current = new FacetRegistrySnapshot($active, $byObject, $collisions, $rejected);
    }

    public function snapshot(): FacetRegistrySnapshot
    {
        return $this->current;
    }

    public function all(): array
    {
        return $this->current->facets;
    }

    public function get(string $facetKey): ?FacetDescriptor
    {
        return $this->current->facets[$facetKey] ?? null;
    }

    public function forObject(string $objectKey, InterfaceContext $context): array
    {
        if ($this->objects->get($objectKey) === null) return [];
        $out = [];
        foreach ($this->current->byObject[$objectKey] ?? [] as $facetKey) {
            $facet = $this->current->facets[$facetKey] ?? null;
            if ($facet !== null && $facet->visibleIn($context)) $out[$facetKey] = $facet;
        }
        return $out;
    }

    /** @param array<string,mixed> $contribution @return array<string,mixed> */
    private function unwrapDescriptor(array $contribution): array
    {
        $descriptor = $contribution['descriptor'] ?? $contribution;
        if (! is_array($descriptor) || array_is_list($descriptor)) throw new \InvalidArgumentException('contribution descriptor must be an object.');
        return $descriptor;
    }
}

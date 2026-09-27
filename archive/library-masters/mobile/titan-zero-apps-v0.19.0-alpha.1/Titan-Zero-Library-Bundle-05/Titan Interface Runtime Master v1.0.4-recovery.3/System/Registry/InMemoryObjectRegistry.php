<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReferenceResolutionException;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ResolvedObjectReference;

final class InMemoryObjectRegistry implements ObjectRegistryContract
{
    private ObjectRegistrySnapshot $current;

    public function __construct()
    {
        $this->current = new ObjectRegistrySnapshot();
    }

    public function rebuild(array $contributions): ObjectRegistrySnapshot
    {
        ksort($contributions, SORT_STRING);
        $objectCandidates = [];
        $relationshipCandidates = [];
        $byContributor = [];
        $rejected = [];

        foreach ($contributions as $extensionKey => $contribution) {
            try {
                $descriptor = $this->unwrapDescriptor($contribution);
                $schemaVersion = (string) ($descriptor['schema_version'] ?? '1.0');
                $objects = $descriptor['objects'] ?? null;
                if (! is_array($objects) || ! array_is_list($objects)) throw new \InvalidArgumentException('objects must be a list.');

                $built = [];
                foreach ($objects as $object) {
                    if (! is_array($object) || array_is_list($object)) throw new \InvalidArgumentException('object entries must be objects.');
                    $built[] = ObjectDescriptor::fromArray((string) $extensionKey, $object);
                }
                foreach ($built as $object) {
                    $objectCandidates[$object->key][] = $object;
                    $byContributor[(string) $extensionKey][] = $object->key;
                }

                if ($schemaVersion === '1.1') {
                    $relationships = $descriptor['relationships'] ?? null;
                    if (! is_array($relationships) || ! array_is_list($relationships)) throw new \InvalidArgumentException('relationships must be a list for contract 1.1.');
                    foreach ($relationships as $relationship) {
                        if (! is_array($relationship) || array_is_list($relationship)) throw new \InvalidArgumentException('relationship entries must be objects.');
                        $key = (string) ($relationship['key'] ?? '');
                        $relationshipCandidates[$key][] = [
                            'extension_key'=>(string)$extensionKey,
                            'key'=>$key,
                            'label'=>(string)($relationship['label'] ?? ''),
                            'source'=>(string)($relationship['source_object_ref'] ?? ''),
                            'target'=>(string)($relationship['target_object_ref'] ?? ''),
                            'kind'=>(string)($relationship['kind'] ?? ''),
                            'inverse'=>array_key_exists('inverse_ref',$relationship) && $relationship['inverse_ref'] !== null ? (string)$relationship['inverse_ref'] : null,
                            'customer_safe'=>($relationship['customer_safe'] ?? null) === true,
                            'legacy'=>false,
                        ];
                    }
                } else {
                    // Contract 1.0 encoded relationships as direct target object keys.
                    foreach ($built as $object) {
                        foreach ($object->relationshipRefs as $targetKey) {
                            $key = $object->key . '->' . $targetKey;
                            $relationshipCandidates[$key][] = [
                                'extension_key'=>(string)$extensionKey,
                                'key'=>$key,
                                'label'=>$targetKey,
                                'source'=>$object->key,
                                'target'=>$targetKey,
                                'kind'=>'association',
                                'inverse'=>null,
                                'customer_safe'=>$object->customerSafe,
                                'legacy'=>true,
                            ];
                        }
                    }
                }
            } catch (\Throwable $e) {
                $rejected[(string) $extensionKey][] = $e->getMessage();
            }
        }

        $collisions = [];
        $active = [];
        foreach ($objectCandidates as $key => $owners) {
            if (count($owners) !== 1) {
                $ownerKeys = array_map(static fn (ObjectDescriptor $object): string => $object->extensionKey, $owners);
                sort($ownerKeys, SORT_STRING);
                $collisions[$key] = array_values(array_unique($ownerKeys));
                continue;
            }
            $active[$key] = $owners[0];
        }
        ksort($active, SORT_STRING);

        $relationshipCollisions = [];
        $rawRelationships = [];
        foreach ($relationshipCandidates as $key => $owners) {
            if (count($owners) !== 1) {
                $keys = array_map(static fn(array $r): string => $r['extension_key'], $owners);
                sort($keys, SORT_STRING);
                $relationshipCollisions[$key] = array_values(array_unique($keys));
                continue;
            }
            $rawRelationships[$key] = $owners[0];
        }

        // Fail closed if a contributor references unavailable objects or relationships.
        $contributorsToReject = [];
        foreach ($rawRelationships as $key => $relationship) {
            if (! isset($active[$relationship['source']]) || ! isset($active[$relationship['target']])) {
                $contributorsToReject[$relationship['extension_key']][] = "relationship '{$key}' references unknown or unavailable object";
            }
            if ($relationship['inverse'] !== null && ! isset($rawRelationships[$relationship['inverse']])) {
                $contributorsToReject[$relationship['extension_key']][] = "relationship '{$key}' inverse_ref references unknown relationship '{$relationship['inverse']}'";
            }
        }
        foreach ($active as $object) {
            $descriptor = $this->descriptorForContributor($contributions, $object->extensionKey);
            $version = (string) ($descriptor['schema_version'] ?? '1.0');
            if ($version !== '1.1') continue;
            foreach ($object->relationshipRefs as $relationshipKey) {
                if (! isset($rawRelationships[$relationshipKey])) {
                    $contributorsToReject[$object->extensionKey][] = "object '{$object->key}' references unknown or unavailable relationship '{$relationshipKey}'";
                    continue;
                }
                if ($rawRelationships[$relationshipKey]['source'] !== $object->key) {
                    $contributorsToReject[$object->extensionKey][] = "object '{$object->key}' references relationship '{$relationshipKey}' whose source differs";
                }
            }
        }

        if ($contributorsToReject !== []) {
            foreach ($contributorsToReject as $extensionKey => $messages) {
                foreach (array_unique($messages) as $message) $rejected[$extensionKey][] = $message;
                foreach ($byContributor[$extensionKey] ?? [] as $ownedKey) unset($active[$ownedKey]);
                foreach ($rawRelationships as $key => $relationship) {
                    if ($relationship['extension_key'] === $extensionKey) unset($rawRelationships[$key]);
                }
            }
            // Relationships contributed by still-active extensions may have lost a source/target.
            foreach ($rawRelationships as $key => $relationship) {
                if (! isset($active[$relationship['source']]) || ! isset($active[$relationship['target']])) unset($rawRelationships[$key]);
            }
        }

        $relationships = [];
        foreach ($rawRelationships as $key => $relationship) {
            $source = $active[$relationship['source']];
            $target = $active[$relationship['target']];
            $relationships[$key] = new ObjectRelationshipDescriptor(
                key: $key,
                label: $relationship['label'],
                sourceObjectKey: $source->key,
                targetObjectKey: $target->key,
                relationshipExtensionKey: $relationship['extension_key'],
                sourceExtensionKey: $source->extensionKey,
                targetExtensionKey: $target->extensionKey,
                kind: $relationship['kind'],
                inverseRef: $relationship['inverse'],
                customerSafe: $relationship['customer_safe'],
                legacy: $relationship['legacy'],
            );
        }

        // Preserve prior collision diagnostics and add typed relationship collisions under a namespaced key.
        foreach ($relationshipCollisions as $key => $owners) $collisions['relationship:' . $key] = $owners;

        ksort($active, SORT_STRING);
        ksort($relationships, SORT_STRING);
        ksort($collisions, SORT_STRING);
        foreach ($rejected as &$messages) $messages = array_values(array_unique($messages));
        unset($messages);
        ksort($rejected, SORT_STRING);

        return $this->current = new ObjectRegistrySnapshot($active, $relationships, $collisions, $rejected);
    }

    public function snapshot(): ObjectRegistrySnapshot { return $this->current; }
    public function all(): array { return $this->current->objects; }
    public function get(string $objectKey): ?ObjectDescriptor { return $this->current->objects[$objectKey] ?? null; }

    public function visibleFor(string $productSurface): array
    {
        $visible = [];
        foreach ($this->current->objects as $key => $object) if ($object->visibleOn($productSurface)) $visible[$key] = $object;
        return $visible;
    }

    public function resolve(ObjectReference $reference, InterfaceContext $context): ResolvedObjectReference
    {
        $object = $this->get($reference->objectKey);
        if ($object === null) throw new ObjectReferenceResolutionException("Unknown or unavailable object '{$reference->objectKey}'.");
        if (! $object->visibleIn($context)) throw new ObjectReferenceResolutionException("Object '{$object->key}' is not authorized or available on product surface '{$context->productSurface}'.");
        if ($object->scopeType === 'tenant') {
            if ($reference->companyId === null) throw new ObjectReferenceResolutionException("Tenant-scoped object '{$object->key}' requires an explicit tenant reference.");
            if ((string) $context->companyId !== $reference->companyId) throw new ObjectReferenceResolutionException('Object reference tenant does not match the authenticated interface tenant.');
        } elseif ($reference->companyId !== null) {
            throw new ObjectReferenceResolutionException("Global object '{$object->key}' must not carry a tenant reference.");
        }
        return new ResolvedObjectReference($reference, $object);
    }

    /** @param array<string,mixed> $contribution @return array<string,mixed> */
    private function unwrapDescriptor(array $contribution): array
    {
        $descriptor = $contribution['descriptor'] ?? $contribution;
        if (! is_array($descriptor) || array_is_list($descriptor)) throw new \InvalidArgumentException('contribution descriptor must be an object.');
        return $descriptor;
    }

    /** @param array<string,array<string,mixed>> $contributions @return array<string,mixed> */
    private function descriptorForContributor(array $contributions, string $extensionKey): array
    {
        $value = $contributions[$extensionKey] ?? [];
        return is_array($value) ? $this->unwrapDescriptor($value) : [];
    }
}

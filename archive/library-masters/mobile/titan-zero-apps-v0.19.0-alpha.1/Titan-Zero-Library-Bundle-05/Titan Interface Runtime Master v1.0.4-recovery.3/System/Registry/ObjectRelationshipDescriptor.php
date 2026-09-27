<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

final readonly class ObjectRelationshipDescriptor implements \JsonSerializable
{
    private const KINDS = ['one-to-one','one-to-many','many-to-one','many-to-many','parent-child','association'];

    public function __construct(
        public string $key,
        public string $label,
        public string $sourceObjectKey,
        public string $targetObjectKey,
        public string $relationshipExtensionKey,
        public string $sourceExtensionKey,
        public string $targetExtensionKey,
        public string $kind = 'association',
        public ?string $inverseRef = null,
        public bool $customerSafe = false,
        public bool $legacy = false,
    ) {
        foreach ([$key,$sourceObjectKey,$targetObjectKey] as $value) {
            if (preg_match('/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/', $value) !== 1 && ! ($legacy && str_contains($key, '->'))) {
                throw new \InvalidArgumentException('relationship key/reference is invalid.');
            }
        }
        if (trim($label) === '') throw new \InvalidArgumentException('relationship label must not be empty.');
        if (! in_array($kind, self::KINDS, true)) throw new \InvalidArgumentException('relationship kind is invalid.');
        if ($inverseRef !== null && preg_match('/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/', $inverseRef) !== 1) {
            throw new \InvalidArgumentException('relationship inverse_ref is invalid.');
        }
    }

    /** @return array<string,mixed> */
    public function jsonSerialize(): array
    {
        return [
            'key' => $this->key,
            'label' => $this->label,
            'source_object_key' => $this->sourceObjectKey,
            'target_object_key' => $this->targetObjectKey,
            'relationship_extension_key' => $this->relationshipExtensionKey,
            'source_extension_key' => $this->sourceExtensionKey,
            'target_extension_key' => $this->targetExtensionKey,
            'kind' => $this->kind,
            'inverse_ref' => $this->inverseRef,
            'customer_safe' => $this->customerSafe,
            'legacy' => $this->legacy,
        ];
    }
}

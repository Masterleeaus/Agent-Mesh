<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;

final readonly class ObjectDescriptor implements \JsonSerializable
{
    private const PRODUCT_SURFACES = ['command', 'go', 'hub', 'onboarding'];
    private const OFFLINE_MODES = ['online-required', 'read-only', 'queueable', 'local-first'];

    /**
     * @param list<string> $productSurfaces
     * @param list<string> $permissions
     * @param list<string> $facetRefs
     * @param list<string> $viewRefs
     * @param list<string> $actionRefs
     * @param list<string> $relationshipRefs
     */
    public function __construct(
        public string $extensionKey,
        public string $key,
        public string $label,
        public string $dataAuthority,
        public string $scopeType,
        public ?string $tenantKey,
        public array $productSurfaces,
        public bool $customerSafe,
        public array $permissions,
        public ?string $lifecycleRef,
        public array $facetRefs,
        public array $viewRefs,
        public array $actionRefs,
        public array $relationshipRefs,
        public string $offlineMode,
    ) {
        self::assertKey($extensionKey, 'extension key', true);
        self::assertKey($key, 'object key');
        if (trim($label) === '') throw new \InvalidArgumentException('object label must not be empty.');
        if (trim($dataAuthority) === '' || strlen($dataAuthority) > 160) throw new \InvalidArgumentException('object data_authority is invalid.');
        if (! in_array($scopeType, ['tenant', 'global'], true)) throw new \InvalidArgumentException('object scope type is invalid.');
        if ($scopeType === 'tenant' && $tenantKey !== 'company_id') {
            throw new \InvalidArgumentException("tenant-scoped object '{$key}' must use company_id as tenant_key.");
        }
        if ($scopeType === 'global' && $tenantKey !== null) {
            throw new \InvalidArgumentException("global object '{$key}' must not declare tenant_key.");
        }
        self::assertUniqueTokenList($productSurfaces, self::PRODUCT_SURFACES, 'object product_surfaces', true);
        if (in_array('hub', $productSurfaces, true) && ! $customerSafe) {
            throw new \InvalidArgumentException("object '{$key}' exposed on hub must be customer_safe.");
        }
        self::assertStringList($permissions, 'object permissions');
        foreach ([$facetRefs, $viewRefs, $actionRefs, $relationshipRefs] as $refs) self::assertKeyList($refs, 'object reference list');
        if ($lifecycleRef !== null) self::assertKey($lifecycleRef, 'object lifecycle_ref');
        if (! in_array($offlineMode, self::OFFLINE_MODES, true)) throw new \InvalidArgumentException('object offline_mode is invalid.');
    }

    /** @param array<string,mixed> $object */
    public static function fromArray(string $extensionKey, array $object): self
    {
        $scope = is_array($object['scope'] ?? null) ? $object['scope'] : [];

        return new self(
            extensionKey: $extensionKey,
            key: (string) ($object['key'] ?? ''),
            label: (string) ($object['label'] ?? ''),
            dataAuthority: (string) ($object['data_authority'] ?? ''),
            scopeType: (string) ($scope['type'] ?? ''),
            tenantKey: array_key_exists('tenant_key', $scope) && $scope['tenant_key'] !== null ? (string) $scope['tenant_key'] : null,
            productSurfaces: self::strings($object['product_surfaces'] ?? null),
            customerSafe: ($object['customer_safe'] ?? null) === true,
            permissions: self::strings($object['permissions'] ?? null),
            lifecycleRef: isset($object['lifecycle_ref']) && $object['lifecycle_ref'] !== null ? (string) $object['lifecycle_ref'] : null,
            facetRefs: self::strings($object['facet_refs'] ?? null),
            viewRefs: self::strings($object['view_refs'] ?? null),
            actionRefs: self::strings($object['action_refs'] ?? null),
            relationshipRefs: self::strings($object['relationship_refs'] ?? null),
            offlineMode: (string) ($object['offline_mode'] ?? ''),
        );
    }

    public function visibleOn(string $productSurface): bool
    {
        if (! in_array($productSurface, self::PRODUCT_SURFACES, true)) {
            throw new \InvalidArgumentException("Unsupported product surface '{$productSurface}'.");
        }
        if (! in_array($productSurface, $this->productSurfaces, true)) return false;
        return $productSurface !== 'hub' || $this->customerSafe;
    }

    public function visibleIn(InterfaceContext $context): bool
    {
        if (! $this->visibleOn($context->productSurface)) return false;
        return $context->hasCapabilities($this->permissions);
    }

    /** @return array<string,mixed> */
    public function jsonSerialize(): array
    {
        return [
            'extension_key' => $this->extensionKey,
            'key' => $this->key,
            'label' => $this->label,
            'data_authority' => $this->dataAuthority,
            'scope' => ['type' => $this->scopeType, 'tenant_key' => $this->tenantKey],
            'product_surfaces' => $this->productSurfaces,
            'customer_safe' => $this->customerSafe,
            'permissions' => $this->permissions,
            'lifecycle_ref' => $this->lifecycleRef,
            'facet_refs' => $this->facetRefs,
            'view_refs' => $this->viewRefs,
            'action_refs' => $this->actionRefs,
            'relationship_refs' => $this->relationshipRefs,
            'offline_mode' => $this->offlineMode,
        ];
    }

    /** @return list<string> */
    private static function strings(mixed $value): array
    {
        if (! is_array($value) || ! array_is_list($value)) throw new \InvalidArgumentException('object list fields must be arrays.');
        foreach ($value as $item) if (! is_string($item)) throw new \InvalidArgumentException('object list fields must contain strings.');
        return array_values($value);
    }

    private static function assertKey(string $value, string $field, bool $hyphenOnly = false): void
    {
        $pattern = $hyphenOnly ? '/^[a-z0-9]+(?:-[a-z0-9]+)*$/' : '/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/';
        if (preg_match($pattern, $value) !== 1) throw new \InvalidArgumentException("{$field} is invalid.");
    }

    /** @param list<string> $values */
    private static function assertKeyList(array $values, string $field): void
    {
        if (count(array_unique($values)) !== count($values)) throw new \InvalidArgumentException("{$field} must contain unique values.");
        foreach ($values as $value) self::assertKey($value, $field);
    }

    /** @param list<string> $values */
    private static function assertStringList(array $values, string $field): void
    {
        if (count(array_unique($values)) !== count($values)) throw new \InvalidArgumentException("{$field} must contain unique values.");
        foreach ($values as $value) if ($value === '' || strlen($value) > 160) throw new \InvalidArgumentException("{$field} contains an invalid value.");
    }

    /** @param list<string> $values @param list<string> $allowed */
    private static function assertUniqueTokenList(array $values, array $allowed, string $field, bool $minOne): void
    {
        if ($minOne && $values === []) throw new \InvalidArgumentException("{$field} must not be empty.");
        if (count(array_unique($values)) !== count($values)) throw new \InvalidArgumentException("{$field} must contain unique values.");
        foreach ($values as $value) if (! in_array($value, $allowed, true)) throw new \InvalidArgumentException("{$field} contains unsupported value '{$value}'.");
    }
}

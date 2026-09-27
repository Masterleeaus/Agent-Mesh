<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;

final readonly class FacetDescriptor implements \JsonSerializable
{
    public const KIND_ORDER = [
        'summary', 'activity', 'relationship', 'messages', 'money', 'evidence',
        'files', 'notes', 'audit', 'automation', 'recommendations', 'approvals',
        'data', 'custom',
    ];
    private const PRODUCT_SURFACES = ['command', 'go', 'hub', 'onboarding'];
    private const CONTAINERS = ['chat', 'card', 'panel', 'drawer', 'wizard', 'board', 'map', 'calendar', 'timeline', 'table', 'canvas', 'report', 'modal', 'full-workspace'];

    /**
     * @param list<string> $appliesTo
     * @param list<string> $productSurfaces
     * @param list<string> $permissions
     */
    public function __construct(
        public string $extensionKey,
        public string $key,
        public string $label,
        public string $kind,
        public array $appliesTo,
        public string $container,
        public array $productSurfaces,
        public bool $customerSafe,
        public array $permissions,
        public ?string $rendererHint,
    ) {
        self::assertKey($extensionKey, true);
        self::assertKey($key);
        if (trim($label) === '') throw new \InvalidArgumentException('facet label must not be empty.');
        if (! in_array($kind, self::KIND_ORDER, true)) throw new \InvalidArgumentException("facet '{$key}' kind is invalid.");
        if ($appliesTo === [] || count(array_unique($appliesTo)) !== count($appliesTo)) throw new \InvalidArgumentException("facet '{$key}' applies_to must contain unique object keys.");
        foreach ($appliesTo as $objectKey) self::assertKey($objectKey);
        if (! in_array($container, self::CONTAINERS, true)) throw new \InvalidArgumentException("facet '{$key}' container is invalid.");
        if ($productSurfaces === [] || count(array_unique($productSurfaces)) !== count($productSurfaces)) throw new \InvalidArgumentException("facet '{$key}' product_surfaces must contain unique values.");
        foreach ($productSurfaces as $surface) if (! in_array($surface, self::PRODUCT_SURFACES, true)) throw new \InvalidArgumentException("facet '{$key}' product surface is invalid.");
        if (in_array('hub', $productSurfaces, true) && ! $customerSafe) throw new \InvalidArgumentException("facet '{$key}' exposed on hub must be customer_safe.");
        if (count(array_unique($permissions)) !== count($permissions)) throw new \InvalidArgumentException("facet '{$key}' permissions must be unique.");
        foreach ($permissions as $permission) if ($permission === '' || strlen($permission) > 160) throw new \InvalidArgumentException("facet '{$key}' permission is invalid.");
        if ($rendererHint !== null && ($rendererHint === '' || strlen($rendererHint) > 160)) throw new \InvalidArgumentException("facet '{$key}' renderer_hint is invalid.");
    }

    /** @param array<string,mixed> $facet */
    public static function fromArray(string $extensionKey, array $facet): self
    {
        return new self(
            extensionKey: $extensionKey,
            key: (string) ($facet['key'] ?? ''),
            label: (string) ($facet['label'] ?? ''),
            kind: (string) ($facet['kind'] ?? ''),
            appliesTo: self::strings($facet['applies_to'] ?? null),
            container: (string) ($facet['container'] ?? ''),
            productSurfaces: self::strings($facet['product_surfaces'] ?? null),
            customerSafe: ($facet['customer_safe'] ?? null) === true,
            permissions: self::strings($facet['permissions'] ?? null),
            rendererHint: array_key_exists('renderer_hint', $facet) && $facet['renderer_hint'] !== null ? (string) $facet['renderer_hint'] : null,
        );
    }

    public function appliesTo(string $objectKey): bool
    {
        return in_array($objectKey, $this->appliesTo, true);
    }

    public function visibleIn(InterfaceContext $context): bool
    {
        if (! in_array($context->productSurface, $this->productSurfaces, true)) return false;
        if ($context->productSurface === 'hub' && ! $this->customerSafe) return false;
        foreach ($this->permissions as $permission) {
            if (! $context->hasCapability($permission)) return false;
        }
        return true;
    }

    public function kindRank(): int
    {
        $rank = array_search($this->kind, self::KIND_ORDER, true);
        return is_int($rank) ? $rank : count(self::KIND_ORDER);
    }

    public function jsonSerialize(): array
    {
        return [
            'extension_key' => $this->extensionKey,
            'key' => $this->key,
            'label' => $this->label,
            'kind' => $this->kind,
            'applies_to' => $this->appliesTo,
            'container' => $this->container,
            'product_surfaces' => $this->productSurfaces,
            'customer_safe' => $this->customerSafe,
            'permissions' => $this->permissions,
            'renderer_hint' => $this->rendererHint,
            'loading' => 'lazy',
        ];
    }

    /** @return list<string> */
    private static function strings(mixed $value): array
    {
        if (! is_array($value) || ! array_is_list($value)) throw new \InvalidArgumentException('facet list fields must be arrays.');
        foreach ($value as $item) if (! is_string($item)) throw new \InvalidArgumentException('facet list fields must contain strings.');
        return array_values($value);
    }

    private static function assertKey(string $value, bool $hyphenOnly = false): void
    {
        $pattern = $hyphenOnly ? '/^[a-z0-9]+(?:-[a-z0-9]+)*$/' : '/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/';
        if (preg_match($pattern, $value) !== 1) throw new \InvalidArgumentException('facet key is invalid.');
    }
}

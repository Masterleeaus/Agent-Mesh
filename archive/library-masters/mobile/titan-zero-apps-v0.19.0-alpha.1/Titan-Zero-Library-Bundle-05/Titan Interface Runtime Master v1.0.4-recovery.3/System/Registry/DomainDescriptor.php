<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Surfaces\IntentSurfaceCatalog;

final readonly class DomainDescriptor implements \JsonSerializable
{
    private const LAYERS = ['business', 'operational-intelligence', 'platform'];
    private const PRODUCT_SURFACES = ['command', 'go', 'hub', 'onboarding'];

    /**
     * @param list<string> $productSurfaces
     * @param list<string> $intentSurfaces
     * @param list<string> $objectRefs
     * @param list<string> $defaultViewRefs
     */
    public function __construct(
        public string $extensionKey,
        public string $key,
        public string $label,
        public string $layer,
        public array $productSurfaces,
        public array $intentSurfaces,
        public array $objectRefs,
        public array $defaultViewRefs,
        public int $priority = 100,
    ) {
        self::assertKey($extensionKey, 'extension_key', true);
        self::assertKey($key, 'domain key');
        if (trim($label) === '') throw new \InvalidArgumentException("Domain '{$key}' label is required.");
        if (! in_array($layer, self::LAYERS, true)) throw new \InvalidArgumentException("Domain '{$key}' layer is unsupported.");
        if ($productSurfaces === []) throw new \InvalidArgumentException("Domain '{$key}' must expose at least one product surface.");
        foreach ($productSurfaces as $surface) {
            if (! in_array($surface, self::PRODUCT_SURFACES, true)) throw new \InvalidArgumentException("Domain '{$key}' product surface '{$surface}' is unsupported.");
        }
        if (count(array_unique($productSurfaces)) !== count($productSurfaces)) throw new \InvalidArgumentException("Domain '{$key}' product surfaces must be unique.");
        if ($intentSurfaces === []) throw new \InvalidArgumentException("Domain '{$key}' must expose at least one intent surface.");
        if ($priority < 0) throw new \InvalidArgumentException("Domain '{$key}' priority must be non-negative.");
        self::assertKeyList($objectRefs, "Domain '{$key}' object_refs");
        self::assertKeyList($defaultViewRefs, "Domain '{$key}' default_view_refs");
    }

    /** @param array<string,mixed> $domain */
    public static function fromArray(string $extensionKey, array $domain): self
    {
        $surfaces = array_values(array_map('strval', is_array($domain['intent_surfaces'] ?? null) ? $domain['intent_surfaces'] : []));

        return new self(
            extensionKey: $extensionKey,
            key: (string) ($domain['key'] ?? ''),
            label: (string) ($domain['label'] ?? ''),
            layer: (string) ($domain['layer'] ?? ''),
            productSurfaces: array_values(array_map('strval', is_array($domain['product_surfaces'] ?? null) ? $domain['product_surfaces'] : [])),
            intentSurfaces: IntentSurfaceCatalog::normalize($surfaces),
            objectRefs: array_values(array_map('strval', is_array($domain['object_refs'] ?? null) ? $domain['object_refs'] : [])),
            defaultViewRefs: array_values(array_map('strval', is_array($domain['default_view_refs'] ?? null) ? $domain['default_view_refs'] : [])),
            priority: is_int($domain['priority'] ?? null) ? $domain['priority'] : 100,
        );
    }

    public function visibleOn(string $productSurface): bool
    {
        if (! in_array($productSurface, self::PRODUCT_SURFACES, true)) {
            throw new \InvalidArgumentException("Unsupported product surface '{$productSurface}'.");
        }

        return in_array($productSurface, $this->productSurfaces, true);
    }

    /** @return array<string,mixed> */
    public function jsonSerialize(): array
    {
        return [
            'extension_key' => $this->extensionKey,
            'key' => $this->key,
            'label' => $this->label,
            'layer' => $this->layer,
            'product_surfaces' => $this->productSurfaces,
            'intent_surfaces' => $this->intentSurfaces,
            'object_refs' => $this->objectRefs,
            'default_view_refs' => $this->defaultViewRefs,
            'priority' => $this->priority,
        ];
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
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;

final readonly class ActionDescriptor implements \JsonSerializable
{
    private const PRODUCT_SURFACES = ['command', 'go', 'hub', 'onboarding'];
    private const OFFLINE_MODES = ['online-required', 'prepare-only', 'queueable', 'local-safe'];
    private const CONTAINERS = ['chat', 'card', 'panel', 'drawer', 'wizard', 'board', 'map', 'calendar', 'timeline', 'table', 'canvas', 'report', 'modal', 'full-workspace'];

    /**
     * @param list<string> $appliesTo
     * @param list<string> $productSurfaces
     * @param list<string> $permissions
     * @param array{kind:string,ref:string}|null $interaction
     */
    public function __construct(
        public string $extensionKey,
        public string $key,
        public string $label,
        public array $appliesTo,
        public bool $mutating,
        public ?string $capabilityRef,
        public ?array $interaction,
        public array $productSurfaces,
        public array $permissions,
        public string $offlineMode,
        public bool $requiresConfirmation,
        public ?string $containerHint,
        public bool $customerSafe,
    ) {
        self::assertKey($extensionKey, true);
        self::assertKey($key);
        if (trim($label) === '') throw new \InvalidArgumentException("action '{$key}' label must not be empty.");
        if ($appliesTo === [] || count(array_unique($appliesTo)) !== count($appliesTo)) throw new \InvalidArgumentException("action '{$key}' applies_to must contain unique object keys.");
        foreach ($appliesTo as $objectKey) self::assertKey($objectKey);
        if ($capabilityRef !== null && ($capabilityRef === '' || strlen($capabilityRef) > 200)) throw new \InvalidArgumentException("action '{$key}' capability_ref is invalid.");
        if ($interaction !== null) {
            if (! in_array($interaction['kind'] ?? null, ['wizard', 'journey'], true)) throw new \InvalidArgumentException("action '{$key}' interaction kind is invalid.");
            if (! is_string($interaction['ref'] ?? null) || $interaction['ref'] === '' || strlen($interaction['ref']) > 200) throw new \InvalidArgumentException("action '{$key}' interaction ref is invalid.");
        }
        if ($mutating && $capabilityRef === null && $interaction === null) throw new \InvalidArgumentException("mutating action '{$key}' must reference a capability or Interaction Engine interaction.");
        if ($productSurfaces === [] || count(array_unique($productSurfaces)) !== count($productSurfaces)) throw new \InvalidArgumentException("action '{$key}' product_surfaces must contain unique values.");
        foreach ($productSurfaces as $surface) if (! in_array($surface, self::PRODUCT_SURFACES, true)) throw new \InvalidArgumentException("action '{$key}' product surface is invalid.");
        if (count(array_unique($permissions)) !== count($permissions)) throw new \InvalidArgumentException("action '{$key}' permissions must be unique.");
        foreach ($permissions as $permission) if ($permission === '' || strlen($permission) > 160) throw new \InvalidArgumentException("action '{$key}' permission is invalid.");
        if (! in_array($offlineMode, self::OFFLINE_MODES, true)) throw new \InvalidArgumentException("action '{$key}' offline_mode is invalid.");
        if ($containerHint !== null && ! in_array($containerHint, self::CONTAINERS, true)) throw new \InvalidArgumentException("action '{$key}' container_hint is invalid.");
    }

    /** @param array<string,mixed> $action */
    public static function fromArray(string $extensionKey, array $action, string $contractVersion = '1.0'): self
    {
        $interaction = null;
        if (is_array($action['interaction'] ?? null) && ! array_is_list($action['interaction'])) {
            $interaction = ['kind'=>(string)($action['interaction']['kind'] ?? ''), 'ref'=>(string)($action['interaction']['ref'] ?? '')];
        }

        return new self(
            extensionKey: $extensionKey,
            key: (string) ($action['key'] ?? ''),
            label: (string) ($action['label'] ?? ''),
            appliesTo: self::strings($action['applies_to'] ?? null),
            mutating: ($action['mutating'] ?? null) === true,
            capabilityRef: array_key_exists('capability_ref', $action) && $action['capability_ref'] !== null ? (string) $action['capability_ref'] : null,
            interaction: $interaction,
            productSurfaces: self::strings($action['product_surfaces'] ?? null),
            permissions: self::strings($action['permissions'] ?? null),
            offlineMode: (string) ($action['offline_mode'] ?? ''),
            requiresConfirmation: ($action['requires_confirmation'] ?? null) === true,
            containerHint: array_key_exists('container_hint', $action) && $action['container_hint'] !== null ? (string) $action['container_hint'] : null,
            customerSafe: array_key_exists('customer_safe', $action) ? (($action['customer_safe'] ?? null) === true) : $contractVersion === '1.0',
        );
    }

    public function visibleIn(InterfaceContext $context): bool
    {
        if (! in_array($context->productSurface, $this->productSurfaces, true)) return false;
        if ($context->productSurface === 'hub' && ! $this->customerSafe) return false;
        foreach ($this->permissions as $permission) if (! $context->hasCapability($permission)) return false;
        return true;
    }

    public function jsonSerialize(): array
    {
        return [
            'extension_key'=>$this->extensionKey,
            'key'=>$this->key,
            'label'=>$this->label,
            'applies_to'=>$this->appliesTo,
            'mutating'=>$this->mutating,
            'capability_ref'=>$this->capabilityRef,
            'interaction'=>$this->interaction,
            'product_surfaces'=>$this->productSurfaces,
            'permissions'=>$this->permissions,
            'offline_mode'=>$this->offlineMode,
            'requires_confirmation'=>$this->requiresConfirmation,
            'container_hint'=>$this->containerHint,
            'customer_safe'=>$this->customerSafe,
        ];
    }

    /** @return list<string> */
    private static function strings(mixed $value): array
    {
        if (! is_array($value) || ! array_is_list($value)) throw new \InvalidArgumentException('action list fields must be arrays.');
        foreach ($value as $item) if (! is_string($item)) throw new \InvalidArgumentException('action list fields must contain strings.');
        return array_values($value);
    }

    private static function assertKey(string $value, bool $hyphenOnly = false): void
    {
        $pattern = $hyphenOnly ? '/^[a-z0-9]+(?:-[a-z0-9]+)*$/' : '/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/';
        if (preg_match($pattern, $value) !== 1) throw new \InvalidArgumentException('action key is invalid.');
    }
}

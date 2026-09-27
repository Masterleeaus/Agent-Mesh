<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Registry;

use App\Extensions\InteractionEngine\System\Capabilities\CapabilityDescriptor;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityRouter;
use App\Extensions\InteractionEngine\System\Contracts\CapabilityHandlerInterface;

/**
 * Catalogue/facade kept for backwards compatibility. External execution is
 * owned by CapabilityRouter; this class only retains Interaction-owned local
 * handlers and declared catalogue entries.
 */
class CapabilityRegistry
{
    /** @var array<string,callable> */
    private array $localHandlers = [];
    /** @var array<string,true> */
    private array $declared = [];

    public function __construct(private readonly CapabilityRouter $router)
    {
    }

    public function declare(string $capability): void
    {
        $capability = trim($capability);
        if ($capability === '') throw new \InvalidArgumentException('Capability identifier cannot be empty.');
        $this->declared[$this->router->canonical($capability)] = true;
    }

    public function declareDescriptor(CapabilityDescriptor $descriptor): void
    {
        $this->declare($descriptor->capability);
    }

    public function register(string $capability, callable $handler, bool $adapterBacked = false): void
    {
        unset($adapterBacked); // retained signature only; single-domain adapters no longer exist.
        $canonical = $this->router->canonical($capability);
        $this->declared[$canonical] = true;
        $this->localHandlers[$canonical] = $handler;
    }

    public function registerHandler(string $capability, CapabilityHandlerInterface $handler): void
    {
        $this->register($capability, static fn(array $payload): mixed => $handler->handle($capability, $payload));
    }

    public function getHandler(string $capability): callable
    {
        $canonical = $this->router->canonical($capability);
        if (!isset($this->localHandlers[$canonical])) {
            throw new \RuntimeException("Capability '{$canonical}' is routed to an external provider and has no local handler.");
        }
        return $this->localHandlers[$canonical];
    }

    public function has(string $capability, ?CapabilityExecutionContext $context = null): bool
    {
        return $this->available($capability, $context);
    }

    public function declared(string $capability): bool
    {
        $canonical = $this->router->canonical($capability);
        return isset($this->declared[$canonical]) || $this->router->descriptor($canonical) !== null;
    }

    public function available(string $capability, ?CapabilityExecutionContext $context = null): bool
    {
        $canonical = $this->router->canonical($capability);
        if (isset($this->localHandlers[$canonical])) return true;
        return ($this->router->status($canonical, $context)['availability'] ?? 'unavailable') === 'available';
    }

    /** @return list<string> */
    public function availableCapabilities(?CapabilityExecutionContext $context = null): array
    {
        $available = [];
        foreach ($this->declaredCapabilities() as $capability) {
            if ($this->available($capability, $context)) $available[] = $capability;
        }
        sort($available);
        return $available;
    }

    /** @return list<string> */
    public function declaredCapabilities(): array
    {
        $all = $this->declared;
        foreach ($this->routerDescriptors() as $capability => $_) $all[$capability] = true;
        $declared = array_keys($all);
        sort($declared);
        return $declared;
    }

    public function status(string $capability, ?CapabilityExecutionContext $context = null): array
    {
        $canonical = $this->router->canonical($capability);
        if (isset($this->localHandlers[$canonical])) {
            return [
                'capability' => $capability,
                'canonical_capability' => $canonical,
                'provider' => 'interaction',
                'declared' => true,
                'registered' => true,
                'supported' => true,
                'available' => true,
                'availability' => 'available',
                'source' => 'local_handler',
                'reason' => null,
                'alias' => $capability !== $canonical,
            ];
        }
        $status = $this->router->status($capability, $context);
        return array_replace($status, [
            'registered' => (bool) ($status['supported'] ?? false),
            'available' => ($status['availability'] ?? 'unavailable') === 'available',
            'source' => ($status['provider'] ?? 'none') === 'none' ? 'none' : 'capability_router',
        ]);
    }

    public function isLocal(string $capability): bool
    {
        return isset($this->localHandlers[$this->router->canonical($capability)]);
    }

    /** @return array<string,CapabilityDescriptor> */
    private function routerDescriptors(): array
    {
        return $this->router->descriptors();
    }
}

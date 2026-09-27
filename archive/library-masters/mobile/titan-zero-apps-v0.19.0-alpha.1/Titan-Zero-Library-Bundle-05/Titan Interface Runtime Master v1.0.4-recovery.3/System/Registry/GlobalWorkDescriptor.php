<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Surfaces\GlobalWorkTrayCatalog;

final readonly class GlobalWorkDescriptor implements \JsonSerializable
{
    private const PRODUCT_SURFACES = ['command', 'go', 'hub', 'onboarding'];

    /** @param list<string> $productSurfaces */
    public function __construct(
        public string $contributorKey,
        public string $tray,
        public string $providerRef,
        public array $productSurfaces,
    ) {
        if (preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $contributorKey) !== 1) {
            throw new \InvalidArgumentException('Global work contributor key is invalid.');
        }
        if (! GlobalWorkTrayCatalog::accepts($tray)) {
            throw new \InvalidArgumentException("Unsupported global work tray '{$tray}'.");
        }
        if (preg_match('/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/', $providerRef) !== 1) {
            throw new \InvalidArgumentException('Global work provider_ref is invalid.');
        }
        if ($productSurfaces === [] || count(array_unique($productSurfaces)) !== count($productSurfaces)) {
            throw new \InvalidArgumentException('Global work product_surfaces must be a non-empty unique list.');
        }
        foreach ($productSurfaces as $surface) {
            if (! in_array($surface, self::PRODUCT_SURFACES, true)) {
                throw new \InvalidArgumentException("Unsupported global work product surface '{$surface}'.");
            }
        }
    }

    /** @param array<string,mixed> $raw */
    public static function fromArray(string $contributorKey, array $raw): self
    {
        foreach (['tray', 'provider_ref', 'product_surfaces'] as $required) {
            if (! array_key_exists($required, $raw)) throw new \InvalidArgumentException("Global work declaration is missing {$required}.");
        }
        if (! is_array($raw['product_surfaces']) || ! array_is_list($raw['product_surfaces'])) {
            throw new \InvalidArgumentException('Global work product_surfaces must be an array.');
        }
        foreach ($raw['product_surfaces'] as $surface) {
            if (! is_string($surface)) throw new \InvalidArgumentException('Global work product_surfaces must contain strings.');
        }

        return new self(
            contributorKey: $contributorKey,
            tray: (string) $raw['tray'],
            providerRef: (string) $raw['provider_ref'],
            productSurfaces: array_values($raw['product_surfaces']),
        );
    }

    public function providerKey(): string
    {
        return $this->contributorKey . ':' . $this->providerRef;
    }

    public function binding(): string
    {
        return 'titan.interface.global-work.' . $this->contributorKey . '.' . $this->providerRef;
    }

    public function visibleOn(string $productSurface): bool
    {
        return in_array($productSurface, $this->productSurfaces, true);
    }

    /** @return array<string,mixed> */
    public function jsonSerialize(): array
    {
        return [
            'contributor_key' => $this->contributorKey,
            'tray' => $this->tray,
            'provider_ref' => $this->providerRef,
            'provider_key' => $this->providerKey(),
            'product_surfaces' => $this->productSurfaces,
        ];
    }
}

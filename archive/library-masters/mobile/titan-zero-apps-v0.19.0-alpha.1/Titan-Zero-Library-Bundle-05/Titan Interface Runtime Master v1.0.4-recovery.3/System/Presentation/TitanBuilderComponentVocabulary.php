<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Presentation;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Presentation\ComponentVocabularyContract;
use Illuminate\Contracts\Container\Container;

/**
 * Soft adapter over Titan Builder's presentation-only ComponentRegistry.
 * No Builder concrete type is imported and the runtime continues to work when Builder is absent.
 */
final readonly class TitanBuilderComponentVocabulary implements ComponentVocabularyContract
{
    private const BUILDER_COMPONENT_REGISTRY = 'App\\Extensions\\TitanBuilder\\System\\Contracts\\ComponentRegistry';

    public function __construct(private Container $container) {}

    public function find(string $id): ?array
    {
        if (preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $id) !== 1) return null;
        $registry = $this->registry();
        if ($registry === null || ! method_exists($registry, 'find')) return null;
        try {
            $value = $registry->find($id);
            return is_array($value) ? $value : null;
        } catch (\Throwable) {
            return null;
        }
    }

    public function ids(): array
    {
        $registry = $this->registry();
        if ($registry === null || ! method_exists($registry, 'ids')) return [];
        try {
            $ids = $registry->ids();
            if (! is_array($ids)) return [];
            $ids = array_values(array_filter($ids, static fn ($id): bool => is_string($id) && preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $id) === 1));
            sort($ids, SORT_STRING);
            return $ids;
        } catch (\Throwable) {
            return [];
        }
    }

    public function source(): string { return $this->registry() === null ? 'titan-interface-runtime-fallback' : 'titan-builder'; }

    private function registry(): ?object
    {
        try {
            if (! $this->container->bound(self::BUILDER_COMPONENT_REGISTRY)) return null;
            $value = $this->container->make(self::BUILDER_COMPONENT_REGISTRY);
            return is_object($value) ? $value : null;
        } catch (\Throwable) {
            return null;
        }
    }
}

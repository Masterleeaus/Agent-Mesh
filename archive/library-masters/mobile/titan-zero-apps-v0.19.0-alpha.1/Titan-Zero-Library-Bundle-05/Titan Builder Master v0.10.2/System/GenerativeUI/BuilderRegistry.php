<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\GenerativeUI;

use RuntimeException;

/**
 * Read-only registry for Titan Builder's packaged declarative resources.
 *
 * The registry deliberately uses filesystem primitives instead of host models so
 * the generic catalogue can boot independently of CRM, TitanAI, Chatbot and mobile runtimes.
 */
final class BuilderRegistry
{
    private const COLLECTIONS = [
        'components', 'blocks', 'pages', 'themes', 'mock-data', 'specs',
        'templates', 'surfaces', 'data-sources', 'actions', 'verticals',
    ];

    public function __construct(private readonly ?string $basePath = null)
    {
    }

    public function manifest(): array
    {
        return $this->read('manifest.json');
    }

    /** @return list<array<string,mixed>> */
    public function all(string $collection): array
    {
        $this->assertCollection($collection);
        $directory = $this->root().DIRECTORY_SEPARATOR.$collection;

        if (! is_dir($directory)) {
            return [];
        }

        $items = [];
        foreach (glob($directory.DIRECTORY_SEPARATOR.'*.json') ?: [] as $path) {
            if (is_file($path)) {
                $items[] = $this->decode((string) file_get_contents($path), $path);
            }
        }

        usort($items, static function (array $left, array $right): int {
            $leftKey = (string) ($left['category'] ?? '')."\0".(string) ($left['name'] ?? $left['id'] ?? '');
            $rightKey = (string) ($right['category'] ?? '')."\0".(string) ($right['name'] ?? $right['id'] ?? '');
            return $leftKey <=> $rightKey;
        });

        return array_values($items);
    }

    public function find(string $collection, string $slug): ?array
    {
        $this->assertCollection($collection);
        $safeSlug = preg_replace('/[^a-z0-9\-]/', '', strtolower($slug));
        if (! is_string($safeSlug) || $safeSlug !== $slug) {
            return null;
        }

        $path = $collection.'/'.$safeSlug.'.json';
        $absolute = $this->root().DIRECTORY_SEPARATOR.$path;

        return is_file($absolute) ? $this->read($path) : null;
    }

    public function mockData(string $slug): array
    {
        return $this->find('mock-data', $slug) ?? [];
    }

    public function catalogue(): array
    {
        return [
            'manifest' => $this->manifest(),
            'components' => $this->all('components'),
            'blocks' => $this->all('blocks'),
            'pages' => $this->all('pages'),
            'themes' => $this->all('themes'),
            'templates' => $this->all('templates'),
            'surfaces' => $this->all('surfaces'),
            'data_sources' => $this->all('data-sources'),
            'actions' => $this->all('actions'),
            'verticals' => $this->all('verticals'),
            'specs' => $this->all('specs'),
            'surface_profiles' => $this->manifest()['surface_profiles'] ?? [],
        ];
    }

    /** @return array<string, array<string,mixed>> */
    public function componentMap(): array
    {
        $map = [];
        foreach ($this->all('components') as $component) {
            if (isset($component['id']) && is_string($component['id'])) {
                $map[$component['id']] = $component;
            }
        }
        return $map;
    }

    /** @return list<string> */
    public function componentIds(): array
    {
        return array_keys($this->componentMap());
    }

    /** @return list<string> */
    public function actionIds(): array
    {
        return array_values(array_filter($this->manifest()['allowed_actions'] ?? [], 'is_string'));
    }

    /** @return list<string> */
    public function dataSourceIds(): array
    {
        $ids = [];
        foreach ($this->all('data-sources') as $source) {
            if (isset($source['id']) && is_string($source['id'])) {
                $ids[] = $source['id'];
            }
        }
        return $ids;
    }

    public function generativeUiCatalogue(): array
    {
        return [
            'version' => '1.1',
            'authority' => 'presentation-only',
            'components' => $this->all('components'),
            'actions' => $this->all('actions') !== [] ? $this->all('actions') : $this->actionIds(),
            'data_sources' => $this->all('data-sources'),
            'specs' => $this->all('specs'),
            'surface_profiles' => $this->manifest()['surface_profiles'] ?? [],
        ];
    }

    public function resolveSectionData(array $section, array $mockData): mixed
    {
        $source = $section['data_source'] ?? null;
        if (! is_string($source) || $source === '') {
            return $section['data'] ?? [];
        }

        $value = $mockData;
        foreach (explode('.', $source) as $segment) {
            if (! is_array($value) || ! array_key_exists($segment, $value)) {
                return [];
            }
            $value = $value[$segment];
        }
        return $value;
    }

    private function read(string $relativePath): array
    {
        $absolute = $this->root().DIRECTORY_SEPARATOR.$relativePath;
        if (! is_file($absolute)) {
            throw new RuntimeException("Builder definition not found: {$relativePath}");
        }

        return $this->decode((string) file_get_contents($absolute), $absolute);
    }

    private function decode(string $json, string $source): array
    {
        $decoded = json_decode($json, true);
        if (! is_array($decoded)) {
            throw new RuntimeException("Invalid builder JSON: {$source}");
        }

        return $decoded;
    }

    private function root(): string
    {
        return $this->basePath ?? dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'resources'.DIRECTORY_SEPARATOR.'builder';
    }

    private function assertCollection(string $collection): void
    {
        if (! in_array($collection, self::COLLECTIONS, true)) {
            throw new RuntimeException("Unsupported builder collection: {$collection}");
        }
    }
}

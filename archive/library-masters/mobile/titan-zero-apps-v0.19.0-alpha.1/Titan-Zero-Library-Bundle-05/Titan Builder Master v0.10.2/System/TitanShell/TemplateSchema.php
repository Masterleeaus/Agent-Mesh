<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\TitanShell;

use RuntimeException;

/** Resolves Builder-owned presentation templates; CRM remains the business authority. */
final class TemplateSchema
{
    public const VERSION = '4.0.0';

    public static function resolve(?string $slug): array
    {
        $requested = trim((string) ($slug ?: 'titan-command'));
        $canonical = PlatformApplicationRegistry::canonicalSlug($requested);
        if ($canonical !== null) {
            $application = PlatformApplicationRegistry::get($canonical);
            $schema = self::read((string) $application['surface']) ?? self::generic((string) $application['surface']);
            $schema = self::normalise($schema, (string) $application['surface']);
            $schema['application'] = $application;
            $schema['identity']['slug'] = $canonical;
            $schema['identity']['name'] = (string) $application['name'];
            if ($requested !== $canonical) {
                $schema['migration'] = ['requested_slug' => $requested, 'canonical_slug' => $canonical, 'legacy' => true];
            }
            return $schema;
        }
        return self::normalise(self::read($requested) ?? self::generic($requested), $requested);
    }

    public static function all(): array
    {
        return array_map(static fn (string $slug): array => self::resolve($slug), PlatformApplicationRegistry::slugs());
    }

    public static function allTemplateSchemas(): array
    {
        $schemas = [];
        foreach (glob(self::directory().DIRECTORY_SEPARATOR.'*.json') ?: [] as $path) {
            $decoded = json_decode((string) file_get_contents($path), true);
            if (! is_array($decoded)) { throw new RuntimeException('Invalid Titan Builder template schema: '.basename($path)); }
            $id = (string) ($decoded['id'] ?? pathinfo($path, PATHINFO_FILENAME));
            $schemas[] = self::normalise($decoded, $id);
        }
        return $schemas;
    }

    private static function read(string $slug): ?array
    {
        if (! preg_match('/^[a-z0-9-]{1,80}$/', $slug)) { return null; }
        $path = self::directory().DIRECTORY_SEPARATOR.$slug.'.json';
        if (! is_file($path)) { return null; }
        $decoded = json_decode((string) file_get_contents($path), true);
        if (! is_array($decoded)) { throw new RuntimeException('Invalid Titan Builder template schema: '.$slug); }
        return $decoded;
    }

    private static function directory(): string
    {
        return dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'resources'.DIRECTORY_SEPARATOR.'builder'.DIRECTORY_SEPARATOR.'templates';
    }

    private static function normalise(array $schema, string $slug): array
    {
        $identity = (array) ($schema['identity'] ?? []);
        $identity['slug'] = (string) ($identity['slug'] ?? $slug);
        $identity['name'] = (string) ($identity['name'] ?? 'Titan Builder App');
        $identity['icon'] = (string) ($identity['icon'] ?? 'apps');
        $identity['accent'] = (string) ($identity['accent'] ?? 'var(--titan-builder-accent, #3157d5)');

        $navigation = (array) ($schema['navigation'] ?? []);
        $navigation['primary'] = array_values((array) ($navigation['primary'] ?? []));
        $navigation['drawer'] = array_values((array) ($navigation['drawer'] ?? []));
        $navigation['default_view'] = (string) ($navigation['default_view'] ?? ($navigation['primary'][0]['id'] ?? 'home'));
        $navigation['header_actions'] = array_values((array) ($navigation['header_actions'] ?? ['notifications', 'settings']));

        return [
            'schema_version' => (string) ($schema['schema_version'] ?? self::VERSION),
            ...$schema,
            'id' => (string) ($schema['id'] ?? $slug),
            'identity' => $identity,
            'navigation' => $navigation,
            'home' => (array) ($schema['home'] ?? ['widgets' => [], 'quick_actions' => []]),
            'assistant' => (array) ($schema['assistant'] ?? ['enabled' => true, 'persistent' => true, 'role' => 'Titan assistant']),
            'data' => (array) ($schema['data'] ?? ['provider' => 'crm', 'sources' => []]),
            'capabilities' => (array) ($schema['capabilities'] ?? ['required' => [], 'optional' => []]),
            'actions' => (array) ($schema['actions'] ?? ['intents' => []]),
            'offline' => (array) ($schema['offline'] ?? ['mode' => 'none']),
            'permissions' => array_values((array) ($schema['permissions'] ?? [])),
            'privacy' => (array) ($schema['privacy'] ?? ['default_mode' => 'minimum-required']),
            'notifications' => array_values((array) ($schema['notifications'] ?? [])),
            'settings_sections' => array_values((array) ($schema['settings_sections'] ?? ['business-data','ai','communications','mobile','privacy','permissions','notifications','appearance','accessibility','diagnostics'])),
            'preview_states' => array_values((array) ($schema['preview_states'] ?? ['mobile','tablet','desktop','online','offline','empty','populated','loading','error','permission-denied'])),
        ];
    }

    private static function generic(string $slug): array
    {
        return [
            'schema_version' => self::VERSION,
            'id' => $slug,
            'identity' => ['name' => 'Titan Builder App', 'slug' => $slug, 'icon' => 'apps', 'accent' => 'var(--titan-builder-accent, #3157d5)'],
            'navigation' => ['default_view' => 'home', 'primary' => [['id' => 'home', 'label' => 'Home', 'icon' => 'home']], 'drawer' => [], 'header_actions' => ['settings']],
            'home' => ['widgets' => [], 'quick_actions' => []],
            'assistant' => ['enabled' => true, 'persistent' => true, 'role' => 'Titan assistant', 'suggested_prompts' => []],
            'data' => ['provider' => 'crm', 'sources' => []],
            'capabilities' => ['required' => [], 'optional' => []],
            'actions' => ['intents' => []],
            'offline' => ['mode' => 'none'],
            'permissions' => [],
            'privacy' => ['default_mode' => 'minimum-required'],
            'notifications' => [],
            'settings_sections' => ['business-data','ai','communications','mobile','privacy','permissions','notifications','appearance','accessibility','diagnostics'],
            'preview_states' => ['mobile','tablet','desktop','online','offline','empty','populated','loading','error','permission-denied'],
        ];
    }
}

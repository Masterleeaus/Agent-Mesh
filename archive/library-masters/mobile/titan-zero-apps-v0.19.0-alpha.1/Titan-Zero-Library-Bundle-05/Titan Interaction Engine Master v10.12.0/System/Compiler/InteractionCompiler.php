<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Compiler;

use App\Extensions\InteractionEngine\System\DTO\InteractionDefinition;
use App\Extensions\InteractionEngine\System\DTO\Section;
use App\Extensions\InteractionEngine\System\DTO\Question;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Symfony\Component\Yaml\Yaml;
use App\Extensions\InteractionEngine\System\Settings\SettingsResolver;

class InteractionCompiler
{
    private string $definitionsPath;
    private SchemaValidator $schemaValidator;
    private FragmentResolver $fragmentResolver;
    private ConditionRegistry $conditionRegistry;

    public function __construct(
        SchemaValidator $schemaValidator,
        FragmentResolver $fragmentResolver,
        ConditionRegistry $conditionRegistry,
        private readonly ?SettingsResolver $settings = null,
    ) {
        $this->definitionsPath = config('interaction-engine.definitions_path');
        $this->schemaValidator = $schemaValidator;
        $this->fragmentResolver = $fragmentResolver;
        $this->conditionRegistry = $conditionRegistry;
    }

    public function compile(string $id): InteractionDefinition
    {
        $cacheKey = 'interaction_definition_' . $id;
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        $raw = $this->loadRaw($id);
        if (!$raw) {
            throw new \RuntimeException("Definition '{$id}' not found.");
        }

        $this->schemaValidator->validate($raw);
        $resolved = $this->fragmentResolver->resolve($raw);
        $resolved = $this->conditionRegistry->expand($resolved);

        $definition = $this->buildDTO($resolved);
        $ttl = $this->settings?->platformInt('cache_ttl', (int) config('interaction-engine.cache_ttl', 3600)) ?? (int) config('interaction-engine.cache_ttl', 3600);
        Cache::put($cacheKey, $definition, $ttl);

        return $definition;
    }

    private function loadRaw(string $id): ?array
    {
        $paths = [
            $this->definitionsPath . '/' . $id . '.json',
            $this->definitionsPath . '/' . $id . '.yaml',
            $this->definitionsPath . '/' . str_replace('.', '/', $id) . '.json',
        ];
        foreach ($paths as $path) {
            if (File::exists($path)) {
                $content = File::get($path);
                if (str_ends_with($path, '.json')) {
                    return json_decode($content, true);
                } else {
                    return Yaml::parse($content);
                }
            }
        }
        return null;
    }

    private function buildDTO(array $resolved): InteractionDefinition
    {
        $sections = array_map(fn($s) => new Section(
            id: $s['id'],
            title: $s['title'],
            questions: array_map(fn($q) => new Question(
                key: $q['key'],
                question: $q['question'],
                responseType: $q['response_type'],
                options: $q['options'] ?? [],
                optionsSource: $q['options_source'] ?? null,
                validation: $q['validation'] ?? [],
                default: $q['default'] ?? null,
                optional: $q['optional'] ?? false,
                handling: $q['handling'] ?? 'ask',
                priority: $q['priority'] ?? 'P1',
                condition: $q['condition'] ?? null,
                metadata: $q['metadata'] ?? [],
            ), $s['questions'] ?? []),
            metadata: $s['metadata'] ?? [],
        ), $resolved['sections']);

        return new InteractionDefinition(
            id: $resolved['id'],
            version: $resolved['version'],
            name: $resolved['name'],
            description: $resolved['description'] ?? '',
            category: $resolved['category'] ?? 'general',
            permissions: $resolved['permissions'] ?? [],
            sections: $sections,
            capability: $resolved['capability'],
            type: $resolved['type'] ?? 'wizard',
            metadata: $resolved['metadata'] ?? [],
        );
    }
}

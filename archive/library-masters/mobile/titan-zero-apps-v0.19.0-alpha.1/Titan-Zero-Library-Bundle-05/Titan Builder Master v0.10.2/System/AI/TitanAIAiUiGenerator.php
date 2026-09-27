<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\AI;

use App\Extensions\TitanBuilder\System\Contracts\AiUiGenerator;
use App\Extensions\TitanBuilder\System\Contracts\DataSourceCatalog;
use App\Extensions\TitanBuilder\System\Contracts\TitanAiRuntimeGateway;
use App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecNormaliser;
use App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecValidator;
use InvalidArgumentException;

/** Delegates reasoning to standalone TitanAI and accepts only governed Builder specs. */
final class TitanAIAiUiGenerator implements AiUiGenerator
{
    private const CONTEXT_KEYS = [
        'company_id','project_id','surface','vertical_slug','application_type','available_components',
        'available_blocks','available_templates','available_themes','available_data_sources','available_action_intents',
        'brand_configuration','device_target','network_state','current_application_spec','user_request',
    ];

    public function __construct(
        private readonly TitanAiRuntimeGateway $runtime,
        private readonly GenerativeUiSpecNormaliser $normaliser,
        private readonly GenerativeUiSpecValidator $validator,
        private readonly DataSourceCatalog $dataSources,
    ) {}

    public function propose(string $prompt, array $context = []): array
    {
        $safeContext = [];
        foreach (self::CONTEXT_KEYS as $key) {
            if (array_key_exists($key, $context)) {
                $safeContext[$key] = $context[$key];
            }
        }
        if (isset($safeContext['company_id']) && (! is_int($safeContext['company_id']) || $safeContext['company_id'] < 1)) {
            throw new InvalidArgumentException('TitanAI Builder context requires a positive company_id.');
        }

        $proposal = $this->runtime->proposeBuilderSpec($prompt, $safeContext);
        if (isset($proposal['company_id']) && isset($safeContext['company_id']) && (int) $proposal['company_id'] !== $safeContext['company_id']) {
            throw new InvalidArgumentException('TitanAI proposals cannot change company_id.');
        }
        unset($proposal['company_id']);

        $normalised = $this->normaliser->normalise($proposal, (string) ($safeContext['surface'] ?? 'builder'));
        $validation = $this->validator->validate($normalised);
        if (! $validation['valid']) {
            throw new InvalidArgumentException('TitanAI proposal failed Builder schema validation.');
        }
        foreach ((array) ($normalised['data_sources'] ?? []) as $sourceId) {
            if (! is_string($sourceId) || ! $this->dataSources->has($sourceId)) {
                throw new InvalidArgumentException('TitanAI proposal references an unknown Builder data source.');
            }
        }
        $this->assertContextAvailability($validation['spec'], $safeContext);
        return $validation['spec'];
    }

    private function assertContextAvailability(array $spec, array $context): void
    {
        if (array_key_exists('available_action_intents', $context)) {
            $allowed = array_fill_keys(array_values(array_filter((array) $context['available_action_intents'], 'is_string')), true);
            foreach ($this->collectActions($spec) as $action) {
                if (! isset($allowed[$action])) {
                    throw new InvalidArgumentException('TitanAI proposal references an action unavailable to this company.');
                }
            }
        }

        if (array_key_exists('available_data_sources', $context)) {
            $allowed = array_fill_keys(array_values(array_filter((array) $context['available_data_sources'], 'is_string')), true);
            foreach ($this->collectDataSources($spec) as $source) {
                if (! isset($allowed[$source])) {
                    throw new InvalidArgumentException('TitanAI proposal references a data source unavailable to this company.');
                }
            }
        }
    }

    /** @return list<string> */
    private function collectActions(array $spec): array
    {
        $ids = [];
        foreach ((array) ($spec['elements'] ?? []) as $element) {
            if (! is_array($element)) { continue; }
            foreach (['on', 'watch'] as $group) {
                foreach ((array) ($element[$group] ?? []) as $bindings) {
                    $list = is_array($bindings) && array_is_list($bindings) ? $bindings : [$bindings];
                    foreach ($list as $binding) {
                        if (is_array($binding) && is_string($binding['action'] ?? null)) {
                            $ids[] = $binding['action'];
                        }
                    }
                }
            }
        }
        return array_values(array_unique($ids));
    }

    /** @return list<string> */
    private function collectDataSources(array $spec): array
    {
        $ids = array_values(array_filter((array) ($spec['data_sources'] ?? []), 'is_string'));
        $walk = function (mixed $value) use (&$walk, &$ids): void {
            if (! is_array($value)) { return; }
            foreach ($value as $key => $child) {
                if (in_array((string) $key, ['data_source', 'dataSource', 'dataSourceId'], true) && is_string($child)) {
                    $ids[] = $child;
                }
                $walk($child);
            }
        };
        foreach ((array) ($spec['elements'] ?? []) as $element) {
            if (is_array($element)) { $walk($element['props'] ?? []); }
        }
        return array_values(array_unique($ids));
    }
}

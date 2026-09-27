<?php

namespace App\Extensions\TitanBuilder\System\GenerativeUI;

use App\Extensions\TitanBuilder\System\Contracts\ActionCatalog;
use App\Extensions\TitanBuilder\System\Migration\LegacyBusinessSpecMigrator;

/**
 * Normalises and safely repairs presentation-only Titan UI specifications.
 *
 * This service never executes actions and never resolves business data.
 */
final class GenerativeUiSpecNormaliser
{
    private const SUPPORTED_SURFACES = ['chat', 'builder', 'page', 'canvas', 'mobile', 'preview'];
    private const MAX_ELEMENTS = 250;

    public function __construct(
        private readonly BuilderRegistry $registry,
        private readonly ?ActionCatalog $actions = null,
        private readonly ?LegacyBusinessSpecMigrator $legacyMigrator = null,
    ) {
    }

    /** @return list<string> */
    private function actionIds(): array
    {
        if ($this->actions === null) {
            return $this->registry->actionIds();
        }
        return array_values(array_filter(array_map(
            static fn (array $action): ?string => is_string($action['id'] ?? null) ? $action['id'] : null,
            $this->actions->all(),
        )));
    }

    public function normalise(array $spec, string $defaultSurface = 'chat'): array
    {
        if ($this->legacyMigrator !== null) {
            $spec = $this->legacyMigrator->migrate($spec)['value'];
        }
        $elements = is_array($spec['elements'] ?? null) && ! array_is_list($spec['elements'])
            ? $spec['elements']
            : [];
        $root = is_string($spec['root'] ?? null) && ($spec['root'] ?? '') !== ''
            ? $spec['root']
            : (array_key_first($elements) ?? 'root');
        $surface = is_string($spec['surface'] ?? null) && in_array($spec['surface'], self::SUPPORTED_SURFACES, true)
            ? $spec['surface']
            : (in_array($defaultSurface, self::SUPPORTED_SURFACES, true) ? $defaultSurface : 'chat');

        return [
            ...$spec,
            'version' => '1.1',
            'surface' => $surface,
            'authority' => 'presentation-only',
            'root' => $root,
            'state' => is_array($spec['state'] ?? null) ? $spec['state'] : [],
            'meta' => is_array($spec['meta'] ?? null) ? $spec['meta'] : [],
            'persistence' => ($spec['persistence'] ?? null) === false
                ? false
                : (is_array($spec['persistence'] ?? null) ? $spec['persistence'] : []),
            'elements' => $elements,
        ];
    }

    /**
     * @return array{spec: array, changes: array<int, array{path: string, message: string}>}
     */
    public function repair(array $input, string $defaultSurface = 'chat'): array
    {
        $spec = $this->normalise($input, $defaultSurface);
        $changes = [];
        $componentIds = array_fill_keys($this->registry->componentIds(), true);
        $actionIds = array_fill_keys($this->actionIds(), true);

        if (count($spec['elements']) > self::MAX_ELEMENTS) {
            $spec['elements'] = array_slice($spec['elements'], 0, self::MAX_ELEMENTS, true);
            $changes[] = ['path' => '/elements', 'message' => 'Trimmed the specification to the maximum element count.'];
        }

        if (! isset($spec['elements'][$spec['root']])) {
            $spec['root'] = array_key_first($spec['elements']) ?? 'root';
            $changes[] = ['path' => '/root', 'message' => 'Selected the first valid element as the root.'];
        }

        if ($spec['elements'] === []) {
            $spec['elements'] = [
                'root' => [
                    'type' => 'alert',
                    'props' => [
                        'tone' => 'warning',
                        'title' => 'Interface repaired',
                        'message' => 'The generated specification did not contain renderable elements.',
                    ],
                ],
            ];
            $spec['root'] = 'root';
            $changes[] = ['path' => '/elements', 'message' => 'Inserted a safe fallback element.'];
        }

        foreach ($spec['elements'] as $key => &$element) {
            if (! is_array($element)) {
                $element = [
                    'type' => 'alert',
                    'props' => ['tone' => 'warning', 'title' => 'Invalid element', 'message' => "Element {$key} was repaired."],
                ];
                $changes[] = ['path' => "/elements/{$key}", 'message' => 'Replaced a malformed element with a safe alert.'];
                continue;
            }

            if (! isset($componentIds[$element['type'] ?? ''])) {
                $unsupported = is_string($element['type'] ?? null) ? $element['type'] : 'unknown';
                $element['type'] = 'alert';
                $element['props'] = [
                    'tone' => 'warning',
                    'title' => 'Unsupported component',
                    'message' => "The {$unsupported} component is not available in this catalogue.",
                ];
                unset($element['children'], $element['repeat'], $element['on'], $element['watch']);
                $changes[] = ['path' => "/elements/{$key}/type", 'message' => 'Replaced an unknown component with a safe alert.'];
            }

            $element['props'] = is_array($element['props'] ?? null) ? $element['props'] : [];
            if (isset($element['children'])) {
                $children = array_values(array_filter(
                    is_array($element['children']) ? $element['children'] : [],
                    static fn (mixed $child): bool => is_string($child) && array_key_exists($child, $spec['elements'])
                ));
                if ($children !== ($element['children'] ?? [])) {
                    $changes[] = ['path' => "/elements/{$key}/children", 'message' => 'Removed missing child references.'];
                }
                $element['children'] = $children;
            }

            foreach (['on', 'watch'] as $group) {
                if (! is_array($element[$group] ?? null)) {
                    unset($element[$group]);
                    continue;
                }
                foreach ($element[$group] as $event => $bindings) {
                    $list = array_is_list($bindings) ? $bindings : [$bindings];
                    $safe = array_values(array_filter($list, static function (mixed $binding) use ($actionIds): bool {
                        return is_array($binding)
                            && is_string($binding['action'] ?? null)
                            && isset($actionIds[$binding['action']]);
                    }));
                    if ($safe === []) {
                        unset($element[$group][$event]);
                        $changes[] = ['path' => "/elements/{$key}/{$group}/{$event}", 'message' => 'Removed unsupported action bindings.'];
                    } else {
                        $element[$group][$event] = count($safe) === 1 ? $safe[0] : $safe;
                    }
                }
                if ($element[$group] === []) {
                    unset($element[$group]);
                }
            }
        }
        unset($element);

        return ['spec' => $spec, 'changes' => $changes];
    }
}

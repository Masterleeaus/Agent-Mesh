<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\GenerativeUI;

use App\Extensions\TitanBuilder\System\Contracts\ActionCatalog;
use App\Extensions\TitanBuilder\System\Contracts\DataSourceCatalog;

/**
 * Validates presentation-only Titan Builder generative UI specifications.
 */
final class GenerativeUiSpecValidator
{
    private const MAX_ELEMENTS = 250;
    private const MAX_DEPTH = 30;
    private const MAX_CHILDREN = 60;
    private const MAX_ACTION_CHAIN = 12;
    private const MAX_STATE_BYTES = 262144;
    private const MAX_DATA_BYTES = 524288;
    private const SUPPORTED_VERSIONS = ['1.0', '1.1'];
    private const SUPPORTED_SURFACES = ['chat', 'builder', 'page', 'canvas', 'mobile', 'preview'];
    private const UNSAFE_PROP_KEYS = ['html', 'rawhtml', 'innerhtml', 'dangerouslysetinnerhtml', 'script', 'javascript', 'srcdoc'];
    private const SAFE_ENV_REFERENCES = ['locale', 'timezone', 'currency', 'online', 'device', 'surface', 'theme'];

    public function __construct(
        private readonly BuilderRegistry $registry,
        private readonly GenerativeUiSpecNormaliser $normaliser,
        private readonly ?ActionCatalog $actions = null,
        private readonly ?DataSourceCatalog $dataSources = null,
    ) {
    }

    /** @return array{valid: bool, issues: list<array{path: string, message: string, severity: string}>, spec: array} */
    public function validate(array $input): array
    {
        $spec = $this->normaliser->normalise($input, is_string($input['surface'] ?? null) ? $input['surface'] : 'chat');
        $issues = [];
        $root = $spec['root'];
        $elements = $spec['elements'];

        if (($input['authority'] ?? 'presentation-only') !== 'presentation-only') {
            $this->issue($issues, '/authority', 'Authority must be presentation-only.');
        }
        if (isset($input['version']) && ! in_array((string) $input['version'], self::SUPPORTED_VERSIONS, true)) {
            $this->issue($issues, '/version', 'Unsupported specification version.');
        }
        if (! in_array($spec['surface'], self::SUPPORTED_SURFACES, true)) {
            $this->issue($issues, '/surface', 'Unsupported rendering surface.');
        }
        if (! is_string($root) || $root === '' || ! $this->safeKey($root)) {
            $this->issue($issues, '/root', 'Root must be a non-empty safe element key.');
        }
        if (! is_array($elements) || array_is_list($elements)) {
            $this->issue($issues, '/elements', 'Elements must be an object keyed by element ID.');
            return ['valid' => false, 'issues' => $issues, 'spec' => $spec];
        }
        if (count($elements) > self::MAX_ELEMENTS) {
            $this->issue($issues, '/elements', 'A spec may contain at most '.self::MAX_ELEMENTS.' elements.');
        }
        if (! array_key_exists((string) $root, $elements)) {
            $this->issue($issues, '/root', 'Root does not reference an existing element.');
        }
        if (strlen((string) json_encode($spec['state'])) > self::MAX_STATE_BYTES) {
            $this->issue($issues, '/state', 'Initial state exceeds the maximum safe size.');
        }
        if (isset($spec['data']) && ! is_array($spec['data'])) {
            $this->issue($issues, '/data', 'Read-only data must be an object.');
        } elseif (isset($spec['data']) && strlen((string) json_encode($spec['data'])) > self::MAX_DATA_BYTES) {
            $this->issue($issues, '/data', 'Read-only data exceeds the maximum safe size.');
        }
        $this->validatePersistence($spec['persistence'], $issues);
        $this->validateSafeValues($spec['state'], '/state', $issues, 0);
        if (isset($spec['data'])) {
            $this->validateSafeValues($spec['data'], '/data', $issues, 0);
        }
        $this->validateDataSources($spec['data_sources'] ?? [], '/data_sources', $issues);

        $componentIds = array_fill_keys($this->registry->componentIds(), true);
        $allowedActions = array_fill_keys($this->actionIds(), true);

        foreach ($elements as $key => $element) {
            $path = '/elements/'.$this->pointerToken((string) $key);
            if (! is_string($key) || ! $this->safeKey($key)) {
                $this->issue($issues, $path, 'Element keys may contain letters, numbers, underscores and hyphens only.');
                continue;
            }
            if (! is_array($element)) {
                $this->issue($issues, $path, 'Element must be an object.');
                continue;
            }

            $type = $element['type'] ?? null;
            if (! is_string($type) || ! isset($componentIds[$type])) {
                $this->issue($issues, $path.'/type', 'Unknown or unregistered component type.');
            }

            if (! isset($element['props']) || ! is_array($element['props'])) {
                $this->issue($issues, $path.'/props', 'Props must be an object.');
            } else {
                $this->validateSafeValues($element['props'], $path.'/props', $issues, 0);
                $this->validateDataSourceReferences($element['props'], $path.'/props', $issues, 0);
            }

            if (isset($element['children'])) {
                if (! is_array($element['children']) || ! array_is_list($element['children'])) {
                    $this->issue($issues, $path.'/children', 'Children must be an array of element keys.');
                } else {
                    if (count($element['children']) > self::MAX_CHILDREN) {
                        $this->issue($issues, $path.'/children', 'An element may contain at most '.self::MAX_CHILDREN.' direct children.');
                    }
                    foreach ($element['children'] as $index => $child) {
                        if (! is_string($child) || ! isset($elements[$child])) {
                            $this->issue($issues, $path.'/children/'.$index, 'Child does not reference an existing element.');
                        }
                    }
                }
            }

            if (isset($element['visible'])) {
                $this->validateVisibility($element['visible'], $path.'/visible', $issues, 0);
            }

            if (isset($element['repeat'])) {
                $repeat = $element['repeat'];
                if (! is_array($repeat) || ! $this->safePointer($repeat['statePath'] ?? null)) {
                    $this->issue($issues, $path.'/repeat', 'Repeat requires a safe JSON Pointer statePath.');
                }
                if (is_array($repeat) && isset($repeat['key']) && (! is_string($repeat['key']) || $repeat['key'] === '')) {
                    $this->issue($issues, $path.'/repeat/key', 'Repeat key must be a non-empty item field name.');
                }
            }

            foreach (['on', 'watch'] as $bindingGroup) {
                if (! isset($element[$bindingGroup])) {
                    continue;
                }
                if (! is_array($element[$bindingGroup]) || array_is_list($element[$bindingGroup])) {
                    $this->issue($issues, $path.'/'.$bindingGroup, ucfirst($bindingGroup).' must be an object.');
                    continue;
                }
                foreach ($element[$bindingGroup] as $event => $bindings) {
                    if (! is_string($event) || $event === '') {
                        $this->issue($issues, $path.'/'.$bindingGroup, 'Binding names must be non-empty strings.');
                        continue;
                    }
                    if ($bindingGroup === 'watch' && ! $this->safePointer($event)) {
                        $this->issue($issues, $path.'/'.$bindingGroup.'/'.$this->pointerToken($event), 'Watch keys must be safe JSON Pointer paths.');
                    }
                    $normalised = $this->normaliseBindings($bindings);
                    if (count($normalised) > self::MAX_ACTION_CHAIN) {
                        $this->issue($issues, $path.'/'.$bindingGroup.'/'.$this->pointerToken($event), 'Action chain exceeds the maximum safe length.');
                    }
                    foreach ($normalised as $bindingIndex => $binding) {
                        $this->validateActionBinding($binding, $path.'/'.$bindingGroup.'/'.$this->pointerToken($event).'/'.$bindingIndex, $issues, $allowedActions);
                    }
                }
            }
        }

        if (is_string($root) && isset($elements[$root])) {
            $reachable = [];
            $this->validateTreeDepth($root, $elements, [], 0, $issues, $reachable);
            foreach (array_keys($elements) as $key) {
                if (! isset($reachable[$key])) {
                    $this->issue($issues, '/elements/'.$this->pointerToken((string) $key), 'Element is not reachable from the root.', 'warning');
                }
            }
        }

        $valid = true;
        foreach ($issues as $issue) {
            if ($issue['severity'] === 'error') {
                $valid = false;
                break;
            }
        }

        return ['valid' => $valid, 'issues' => $issues, 'spec' => $spec];
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

    public function isValid(array $spec): bool
    {
        return $this->validate($spec)['valid'];
    }

    private function validateDataSources(mixed $sources, string $path, array &$issues): void
    {
        if ($sources === [] || $sources === null) { return; }
        if (! is_array($sources) || ! array_is_list($sources)) {
            $this->issue($issues, $path, 'Data sources must be an array of registered source IDs.');
            return;
        }
        foreach ($sources as $index => $source) {
            if (! is_string($source) || $this->dataSources === null || ! $this->dataSources->has($source)) {
                $this->issue($issues, $path.'/'.$index, 'Data source is not in the Builder catalog.');
            }
        }
    }

    private function validateDataSourceReferences(mixed $value, string $path, array &$issues, int $depth): void
    {
        if ($depth > self::MAX_DEPTH || ! is_array($value)) { return; }
        foreach ($value as $key => $child) {
            $keyString = (string) $key;
            if (in_array($keyString, ['data_source','dataSource','dataSourceId'], true) && is_string($child)) {
                if ($this->dataSources === null || ! $this->dataSources->has($child)) {
                    $this->issue($issues, $path.'/'.$this->pointerToken($keyString), 'Data source is not in the Builder catalog.');
                }
            }
            $this->validateDataSourceReferences($child, $path.'/'.$this->pointerToken($keyString), $issues, $depth + 1);
        }
    }

    private function validatePersistence(mixed $persistence, array &$issues): void
    {
        if ($persistence === false) {
            return;
        }
        if (! is_array($persistence) || ($persistence !== [] && array_is_list($persistence))) {
            $this->issue($issues, '/persistence', 'Persistence must be false or an object.');
            return;
        }
        $scope = $persistence['scope'] ?? 'message';
        if (! in_array($scope, ['message', 'session', 'none'], true)) {
            $this->issue($issues, '/persistence/scope', 'Unsupported persistence scope.');
        }
        if (isset($persistence['key']) && (! is_string($persistence['key']) || strlen($persistence['key']) > 120)) {
            $this->issue($issues, '/persistence/key', 'Persistence key must be a string no longer than 120 characters.');
        }
        if (isset($persistence['historyLimit']) && (! is_int($persistence['historyLimit']) || $persistence['historyLimit'] < 1 || $persistence['historyLimit'] > 100)) {
            $this->issue($issues, '/persistence/historyLimit', 'History limit must be between 1 and 100.');
        }
        $allowed = ['scope', 'key', 'historyLimit'];
        foreach (array_keys($persistence) as $key) {
            if (! in_array($key, $allowed, true)) {
                $this->issue($issues, '/persistence/'.$this->pointerToken((string) $key), 'Unsupported persistence option.');
            }
        }
    }

    private function validateActionBinding(mixed $binding, string $path, array &$issues, array $allowedActions): void
    {
        if (! is_array($binding) || array_is_list($binding)) {
            $this->issue($issues, $path, 'Action binding must be an object.');
            return;
        }
        $action = $binding['action'] ?? null;
        if (! is_string($action) || ! isset($allowedActions[$action])) {
            $this->issue($issues, $path.'/action', 'Action is not in the builder allow-list.');
        }
        if (isset($binding['params']) && (! is_array($binding['params']) || array_is_list($binding['params']))) {
            $this->issue($issues, $path.'/params', 'Action parameters must be an object.');
        } elseif (isset($binding['params'])) {
            $this->validateSafeValues($binding['params'], $path.'/params', $issues, 0);
        }
        if (isset($binding['confirm']) && ! is_bool($binding['confirm']) && ! is_string($binding['confirm'])) {
            $this->issue($issues, $path.'/confirm', 'Confirm must be a boolean or prompt string.');
        }
    }

    private function validateSafeValues(mixed $value, string $path, array &$issues, int $depth): void
    {
        if ($depth > self::MAX_DEPTH) {
            $this->issue($issues, $path, 'Value is nested too deeply.');
            return;
        }
        if (is_string($value)) {
            if (strlen($value) > 20000) {
                $this->issue($issues, $path, 'String value exceeds the maximum safe length.');
                return;
            }
            if (preg_match('/^\s*(?:javascript:|vbscript:|data:text\/html)/i', $value) || preg_match('/<\/?script\b|\bon(?:error|load)\s*=/i', $value)) {
                $this->issue($issues, $path, 'Executable markup or script-like values are not permitted.');
            }
            return;
        }
        if (! is_array($value)) {
            return;
        }
        foreach ($value as $key => $child) {
            $keyString = (string) $key;
            if (is_string($key) && in_array(strtolower($key), self::UNSAFE_PROP_KEYS, true)) {
                $this->issue($issues, $path.'/'.$this->pointerToken($key), 'Raw HTML or script properties are not permitted.');
            }
            if (in_array($keyString, ['$state', '$data'], true) && ! $this->safePointer($child)) {
                $this->issue($issues, $path.'/'.$this->pointerToken($keyString), 'State/data references must use a safe JSON Pointer.');
            }
            if ($keyString === '$env' && (! is_string($child) || ! in_array($child, self::SAFE_ENV_REFERENCES, true))) {
                $this->issue($issues, $path.'/$env', 'Environment references are restricted to non-secret presentation context.');
            }
            $this->validateSafeValues($child, $path.'/'.$this->pointerToken($keyString), $issues, $depth + 1);
        }
    }

    private function validateVisibility(mixed $condition, string $path, array &$issues, int $depth): void
    {
        if ($depth > self::MAX_DEPTH) {
            $this->issue($issues, $path, 'Visibility condition is nested too deeply.');
            return;
        }
        if (is_bool($condition)) {
            return;
        }
        if (! is_array($condition)) {
            $this->issue($issues, $path, 'Visibility must be a boolean, condition or condition array.');
            return;
        }
        if (array_is_list($condition)) {
            foreach ($condition as $index => $child) {
                $this->validateVisibility($child, $path.'/'.$index, $issues, $depth + 1);
            }
            return;
        }
        foreach (['$and', '$or'] as $operator) {
            if (array_key_exists($operator, $condition)) {
                if (! is_array($condition[$operator]) || ! array_is_list($condition[$operator])) {
                    $this->issue($issues, $path.'/'.$operator, $operator.' must contain an array of conditions.');
                    return;
                }
                foreach ($condition[$operator] as $index => $child) {
                    $this->validateVisibility($child, $path.'/'.$operator.'/'.$index, $issues, $depth + 1);
                }
                return;
            }
        }
        $hasSource = $this->safePointer($condition['$state'] ?? null)
            || $this->safePointer($condition['$data'] ?? null)
            || is_string($condition['$item'] ?? null)
            || ($condition['$index'] ?? null) === true;
        if (! $hasSource) {
            $this->issue($issues, $path, 'Visibility condition requires $state, $data, $item or $index.');
        }
    }

    private function validateTreeDepth(string $key, array $elements, array $ancestors, int $depth, array &$issues, array &$reachable): void
    {
        $reachable[$key] = true;
        if ($depth > self::MAX_DEPTH) {
            $this->issue($issues, '/elements/'.$this->pointerToken($key), 'Element tree exceeds maximum depth.');
            return;
        }
        if (isset($ancestors[$key])) {
            $this->issue($issues, '/elements/'.$this->pointerToken($key), 'Element tree contains a cycle.');
            return;
        }
        $ancestors[$key] = true;
        $children = $elements[$key]['children'] ?? [];
        if (! is_array($children)) {
            return;
        }
        foreach ($children as $child) {
            if (is_string($child) && isset($elements[$child])) {
                $this->validateTreeDepth($child, $elements, $ancestors, $depth + 1, $issues, $reachable);
            }
        }
    }

    /** @return list<mixed> */
    private function normaliseBindings(mixed $bindings): array
    {
        if (! is_array($bindings)) {
            return [$bindings];
        }
        return array_is_list($bindings) ? $bindings : [$bindings];
    }

    private function safePointer(mixed $path): bool
    {
        return is_string($path)
            && ($path === '/' || str_starts_with($path, '/'))
            && strlen($path) <= 512
            && ! str_contains($path, '..')
            && ! preg_match('/[\x00-\x1F\x7F]/', $path)
            && ! preg_match('/~(?![01])/', $path);
    }

    private function safeKey(string $key): bool
    {
        return (bool) preg_match('/^[A-Za-z0-9_-]{1,100}$/', $key);
    }

    private function pointerToken(string $value): string
    {
        return str_replace(['~', '/'], ['~0', '~1'], $value);
    }

    private function issue(array &$issues, string $path, string $message, string $severity = 'error'): void
    {
        $issues[] = compact('path', 'message', 'severity');
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Discovery;

final class InterfaceContributionValidator
{
    private const PRODUCT_SURFACES = ['command', 'go', 'hub', 'onboarding'];
    private const INTENT_SURFACES = ['home', 'ask', 'work', 'do', 'decide', 'explore', 'insights', 'data'];
    private const CONTAINERS = ['chat', 'card', 'panel', 'drawer', 'wizard', 'board', 'map', 'calendar', 'timeline', 'table', 'canvas', 'report', 'modal', 'full-workspace'];
    private const REQUIRED_TOP_V10 = ['schema_version', 'extension_key', 'context', 'domains', 'objects', 'facets', 'views', 'actions', 'lifecycles', 'global_work', 'providers', 'legacy_data_surfaces'];
    private const REQUIRED_TOP_V11 = ['schema_version', 'extension_key', 'context', 'domains', 'objects', 'facets', 'views', 'actions', 'relationships', 'lifecycles', 'global_work', 'providers', 'legacy_data_surfaces'];
    private const ALLOWED_TOP = ['$schema', 'schema_version', 'extension_key', 'context', 'domains', 'objects', 'facets', 'views', 'actions', 'relationships', 'lifecycles', 'global_work', 'providers', 'legacy_data_surfaces'];

    /** @param array<string, mixed> $data */
    public function validate(array $data, string $declaredExtensionKey): InterfaceContributionValidationResult
    {
        $errors = [];
        $schemaVersion = is_string($data['schema_version'] ?? null) ? $data['schema_version'] : '';
        $requiredTop = $schemaVersion === '1.1' ? self::REQUIRED_TOP_V11 : self::REQUIRED_TOP_V10;
        foreach ($requiredTop as $key) {
            if (! array_key_exists($key, $data)) {
                $errors[] = "missing required field '{$key}'";
            }
        }
        foreach (array_keys($data) as $key) {
            if (! in_array($key, self::ALLOWED_TOP, true)) {
                $errors[] = "unknown top-level field '{$key}'";
            }
        }
        if (! in_array($schemaVersion, ['1.0', '1.1'], true)) {
            $errors[] = 'schema_version must be 1.0 or 1.1';
        }
        if (($data['extension_key'] ?? null) !== $declaredExtensionKey) {
            $errors[] = 'interface contribution extension_key must match extension key';
        }
        if (! $this->validKey($data['extension_key'] ?? null, true)) {
            $errors[] = 'extension_key is invalid';
        }

        $this->validateContext($data['context'] ?? null, $errors);
        $arraySections = ['domains', 'objects', 'facets', 'views', 'actions', 'lifecycles', 'global_work', 'legacy_data_surfaces'];
        if ($schemaVersion === '1.1') $arraySections[] = 'relationships';
        foreach ($arraySections as $section) {
            if (! is_array($data[$section] ?? null) || ! array_is_list($data[$section])) {
                $errors[] = "{$section} must be an array";
            }
        }
        if (is_array($data['domains'] ?? null) && count($data['domains']) < 1) {
            $errors[] = 'domains must contain at least one domain';
        }
        $providers = $data['providers'] ?? null;
        if (! is_array($providers) || array_is_list($providers)) {
            $errors[] = 'providers must be an object';
        } else {
            foreach (['attention', 'decisions', 'insights'] as $kind) {
                if (! is_array($providers[$kind] ?? null) || ! array_is_list($providers[$kind])) {
                    $errors[] = "providers.{$kind} must be an array";
                }
            }
            foreach (array_keys($providers) as $key) {
                if (! in_array($key, ['attention', 'decisions', 'insights'], true)) {
                    $errors[] = "providers contains unknown field '{$key}'";
                }
            }
        }

        $objects = $this->keyed($data['objects'] ?? [], 'objects', $errors);
        $facets = $this->keyed($data['facets'] ?? [], 'facets', $errors);
        $views = $this->keyed($data['views'] ?? [], 'views', $errors);
        $actions = $this->keyed($data['actions'] ?? [], 'actions', $errors);
        $lifecycles = $this->keyed($data['lifecycles'] ?? [], 'lifecycles', $errors);
        $relationships = $schemaVersion === '1.1' ? $this->keyed($data['relationships'] ?? [], 'relationships', $errors) : [];
        $this->keyed($data['domains'] ?? [], 'domains', $errors);

        foreach ($data['domains'] ?? [] as $domain) {
            if (! is_array($domain)) { $errors[] = 'domain entries must be objects'; continue; }
            $domainKey = (string) ($domain['key'] ?? '?');
            $this->requiredKeys($domain, ['key','label','layer','product_surfaces','intent_surfaces','object_refs','default_view_refs'], 'domain', $errors);
            $this->surfaces($domain['product_surfaces'] ?? null, self::PRODUCT_SURFACES, "domain '{$domainKey}' product_surfaces", $errors);
            $this->surfaces($domain['intent_surfaces'] ?? null, self::INTENT_SURFACES, "domain '{$domainKey}' intent_surfaces", $errors);
            foreach ($domain['object_refs'] ?? [] as $ref) if (! isset($objects[$ref])) $errors[] = "interface domain '{$domainKey}' references unknown object '{$ref}'";
            foreach ($domain['default_view_refs'] ?? [] as $ref) if (! isset($views[$ref])) $errors[] = "interface domain '{$domainKey}' references unknown view '{$ref}'";
        }

        foreach ($data['objects'] ?? [] as $object) {
            if (! is_array($object)) { $errors[] = 'object entries must be objects'; continue; }
            $key = (string) ($object['key'] ?? '?');
            $this->requiredKeys($object, ['key','label','data_authority','scope','product_surfaces','customer_safe','permissions','facet_refs','view_refs','action_refs','relationship_refs','offline_mode'], "object '{$key}'", $errors);
            $this->surfaces($object['product_surfaces'] ?? null, self::PRODUCT_SURFACES, "object '{$key}' product_surfaces", $errors);
            if (in_array('hub', $object['product_surfaces'] ?? [], true) && ($object['customer_safe'] ?? null) !== true) $errors[] = "interface object '{$key}' exposed on hub must set customer_safe=true";
            $scope = $object['scope'] ?? null;
            if (! is_array($scope) || array_is_list($scope)) {
                $errors[] = "interface object '{$key}' scope must be an object";
            } else {
                $scopeType = $scope['type'] ?? null;
                $tenantKey = $scope['tenant_key'] ?? null;
                if (! in_array($scopeType, ['tenant','global'], true)) $errors[] = "interface object '{$key}' scope.type is invalid";
                if ($scopeType === 'tenant' && $tenantKey !== 'company_id') $errors[] = "interface object '{$key}' tenant scope must use company_id";
                if ($scopeType === 'global' && $tenantKey !== null) $errors[] = "interface object '{$key}' global scope must not define tenant_key";
            }
            foreach ($object['relationship_refs'] ?? [] as $ref) {
                if (! $this->validKey($ref)) {
                    $errors[] = "interface object '{$key}' relationship_refs contains invalid key";
                    continue;
                }
                if ($schemaVersion === '1.1' && ! isset($relationships[$ref])) {
                    $errors[] = "interface object '{$key}' references unknown relationship '{$ref}'";
                }
            }
            if (($object['lifecycle_ref'] ?? null) !== null && ! isset($lifecycles[$object['lifecycle_ref']])) $errors[] = "interface object '{$key}' references unknown lifecycle";
            foreach ([['facet_refs',$facets],['view_refs',$views],['action_refs',$actions]] as [$field,$known]) foreach ($object[$field] ?? [] as $ref) if (! isset($known[$ref])) $errors[] = "interface object '{$key}' {$field} references unknown key '{$ref}'";
            if (! in_array($object['offline_mode'] ?? null, ['online-required','read-only','queueable','local-first'], true)) $errors[] = "object '{$key}' offline_mode is invalid";
        }

        foreach (['facets' => $facets, 'views' => $views] as $section => $_) {
            foreach ($data[$section] ?? [] as $item) {
                if (! is_array($item)) { $errors[] = "{$section} entries must be objects"; continue; }
                $key = (string) ($item['key'] ?? '?');
                $this->surfaces($item['product_surfaces'] ?? null, self::PRODUCT_SURFACES, "{$section} '{$key}' product_surfaces", $errors);
                if (in_array('hub', $item['product_surfaces'] ?? [], true) && ($item['customer_safe'] ?? null) !== true) $errors[] = "interface " . substr($section, 0, -1) . " '{$key}' exposed on hub must set customer_safe=true";
                foreach ($item['applies_to'] ?? [] as $ref) {
                    if ($section === 'facets') {
                        if (! $this->validKey($ref)) $errors[] = "interface facet '{$key}' applies_to contains invalid object key";
                    } elseif (! isset($objects[$ref])) {
                        $errors[] = "interface view '{$key}' applies_to unknown object '{$ref}'";
                    }
                }
            }
        }
        foreach ($data['facets'] ?? [] as $facet) {
            if (! is_array($facet)) continue;
            $key = (string) ($facet['key'] ?? '?');
            if (! in_array($facet['container'] ?? null, self::CONTAINERS, true)) $errors[] = "facet '{$key}' container is invalid";
        }
        foreach ($data['views'] ?? [] as $view) {
            if (! is_array($view)) continue;
            $key = (string) ($view['key'] ?? '?');
            if (! in_array($view['kind'] ?? null, ['cards','table','board','calendar','timeline','map','scenario','canvas','report','graph','feed'], true)) $errors[] = "view '{$key}' kind is invalid";
            if (! is_array($view['data_source'] ?? null)) $errors[] = "view '{$key}' data_source must be an object";
        }
        foreach ($data['actions'] ?? [] as $action) {
            if (! is_array($action)) continue;
            $key = (string) ($action['key'] ?? '?');
            // Action targets may live in another installed extension. Validate syntax here;
            // ActionRegistry performs global existence/collision validation after object discovery.
            foreach ($action['applies_to'] ?? [] as $ref) if (! $this->validKey($ref)) $errors[] = "interface action '{$key}' applies_to contains invalid object key";
            if (($action['mutating'] ?? null) === true && empty($action['capability_ref']) && empty($action['interaction'])) $errors[] = "interface mutating action '{$key}' must reference capability_ref or Interaction Engine wizard/journey";
            if (isset($action['container_hint']) && $action['container_hint'] !== null && ! in_array($action['container_hint'], self::CONTAINERS, true)) $errors[] = "action '{$key}' container_hint is invalid";
            if ($schemaVersion === '1.1' && in_array('hub', $action['product_surfaces'] ?? [], true) && ($action['customer_safe'] ?? null) !== true) {
                $errors[] = "interface action '{$key}' exposed on hub must set customer_safe=true";
            }
        }

        if ($schemaVersion === '1.1') {
            foreach ($data['relationships'] ?? [] as $relationship) {
                if (! is_array($relationship) || array_is_list($relationship)) { $errors[] = 'relationship entries must be objects'; continue; }
                $key = (string) ($relationship['key'] ?? '?');
                $this->requiredKeys($relationship, ['key','label','source_object_ref','target_object_ref','kind','customer_safe'], "relationship '{$key}'", $errors);
                foreach (['source_object_ref','target_object_ref'] as $field) {
                    if (! $this->validKey($relationship[$field] ?? null)) $errors[] = "relationship '{$key}' {$field} is invalid";
                }
                if (! in_array($relationship['kind'] ?? null, ['one-to-one','one-to-many','many-to-one','many-to-many','parent-child','association'], true)) {
                    $errors[] = "relationship '{$key}' kind is invalid";
                }
                if (array_key_exists('inverse_ref', $relationship) && $relationship['inverse_ref'] !== null && ! $this->validKey($relationship['inverse_ref'])) {
                    $errors[] = "relationship '{$key}' inverse_ref is invalid";
                }
                if (! is_bool($relationship['customer_safe'] ?? null)) $errors[] = "relationship '{$key}' customer_safe must be boolean";
            }
        }

        foreach ($data['lifecycles'] ?? [] as $life) {
            if (! is_array($life)) continue;
            $key = (string) ($life['key'] ?? '?');
            if (! isset($objects[$life['object_ref'] ?? ''])) $errors[] = "interface lifecycle '{$key}' references unknown object";
            $states = $this->keyed($life['states'] ?? [], "lifecycle {$key} states", $errors);
            foreach ($life['transitions'] ?? [] as $transition) {
                if (! is_array($transition)) { $errors[] = "lifecycle '{$key}' transition must be an object"; continue; }
                if (! isset($states[$transition['from'] ?? '']) || ! isset($states[$transition['to'] ?? ''])) $errors[] = "interface lifecycle '{$key}' transition references unknown state";
                if (! isset($actions[$transition['action_ref'] ?? ''])) $errors[] = "interface lifecycle '{$key}' transition references unknown action";
            }
        }
        foreach ((is_array($providers) ? $providers : []) as $kind => $items) {
            if (! is_array($items)) continue;
            $this->keyed($items, "providers.{$kind}", $errors);
            foreach ($items as $provider) {
                if (! is_array($provider)) continue;
                foreach ($provider['object_refs'] ?? [] as $ref) if (! isset($objects[$ref])) $errors[] = "provider '{$provider['key']}' references unknown object '{$ref}'";
                foreach ($provider['action_refs'] ?? [] as $ref) if (! isset($actions[$ref])) $errors[] = "provider '{$provider['key']}' references unknown action '{$ref}'";
            }
        }
        foreach ($data['global_work'] ?? [] as $index => $item) {
            if (! is_array($item) || array_is_list($item)) { $errors[] = "global_work entry {$index} must be an object"; continue; }
            $this->requiredKeys($item, ['tray','provider_ref','product_surfaces'], 'global_work', $errors);
            if (! in_array($item['tray'] ?? null, ['continue','attention','approvals','inbox','sync'], true)) $errors[] = "global_work entry {$index} tray is invalid";
            if (! $this->validKey($item['provider_ref'] ?? null)) $errors[] = "global_work entry {$index} provider_ref is invalid";
            $this->surfaces($item['product_surfaces'] ?? null, self::PRODUCT_SURFACES, "global_work entry {$index} product_surfaces", $errors);
        }
        foreach ($data['legacy_data_surfaces'] ?? [] as $surface) {
            if (! is_array($surface)) continue;
            foreach ($surface['object_refs'] ?? [] as $ref) if (! isset($objects[$ref])) $errors[] = "legacy data surface '{$surface['key']}' references unknown object '{$ref}'";
        }

        return new InterfaceContributionValidationResult(array_values(array_unique($errors)));
    }

    /** @param list<string> $errors */
    private function validateContext(mixed $context, array &$errors): void
    {
        if (! is_array($context) || array_is_list($context)) { $errors[] = 'context must be an object'; return; }
        $this->requiredKeys($context, ['required','optional'], 'context', $errors);
        $required = $context['required'] ?? null;
        $optional = $context['optional'] ?? null;
        $this->surfaces($required, ['company_id','user_id','product_surface','domain'], 'context.required', $errors);
        $this->surfaces($optional, ['branch_id','workspace_id','team_id','device_id','object_ref','conversation_id','journey_id'], 'context.optional', $errors, false);
    }

    /** @param list<mixed> $items @param list<string> $errors @return array<string, array<string,mixed>> */
    private function keyed(array $items, string $section, array &$errors): array
    {
        $known = [];
        foreach ($items as $item) {
            if (! is_array($item)) { $errors[] = "{$section} entries must be objects"; continue; }
            $key = $item['key'] ?? null;
            if (! $this->validKey($key)) { $errors[] = "{$section} contains invalid key"; continue; }
            if (isset($known[$key])) $errors[] = "{$section} contains duplicate key '{$key}'";
            $known[$key] = $item;
        }
        return $known;
    }

    private function validKey(mixed $value, bool $hyphenOnly = false): bool
    {
        return is_string($value) && preg_match($hyphenOnly ? '/^[a-z0-9]+(?:-[a-z0-9]+)*$/' : '/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/', $value) === 1;
    }

    /** @param list<string> $required @param list<string> $errors */
    private function requiredKeys(array $item, array $required, string $label, array &$errors): void
    {
        foreach ($required as $key) if (! array_key_exists($key, $item)) $errors[] = "{$label} missing required field '{$key}'";
    }

    /** @param list<string> $allowed @param list<string> $errors */
    private function surfaces(mixed $values, array $allowed, string $label, array &$errors, bool $minOne = true): void
    {
        if (! is_array($values) || ! array_is_list($values)) { $errors[] = "{$label} must be an array"; return; }
        if ($minOne && $values === []) $errors[] = "{$label} must not be empty";
        if (count(array_unique($values, SORT_REGULAR)) !== count($values)) $errors[] = "{$label} must contain unique values";
        foreach ($values as $value) if (! in_array($value, $allowed, true)) $errors[] = "{$label} contains unsupported value '{$value}'";
    }
}

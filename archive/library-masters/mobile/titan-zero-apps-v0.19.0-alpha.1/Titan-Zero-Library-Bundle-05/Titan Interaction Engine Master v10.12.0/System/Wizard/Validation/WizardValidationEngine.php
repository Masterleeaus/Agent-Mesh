<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard\Validation;

final class WizardValidationEngine
{
    public function __construct(private readonly ?BranchConditionEvaluator $branches = null) {}

    /** @return array<string,mixed> */
    public function filterStepInput(array $step, array $input, array $existing = []): array
    {
        $allowed = [];
        $allData = array_replace($existing, $input);
        $branches = $this->branches ?? new BranchConditionEvaluator();
        foreach ((array) ($step['fields'] ?? []) as $field) {
            $id = (string) ($field['id'] ?? '');
            if ($id !== '' && $branches->applies($field, $allData)) {
                $allowed[$id] = true;
            }
        }
        return array_intersect_key($input, $allowed);
    }

    public function validateStep(array $step, array $input, array $existing = []): array
    {
        $errors = [];
        $fields = $step['fields'] ?? [];
        $allData = array_replace($existing, $input);
        $branches = $this->branches ?? new BranchConditionEvaluator();
        foreach ($fields as $field) {
            $id = (string) ($field['id'] ?? '');
            if ($id === '' || !$branches->applies($field, $allData)) continue;

            $value = $input[$id] ?? $existing[$id] ?? null;
            $required = (bool) ($field['required'] ?? $field['validation']['required'] ?? false);
            if ($required && ($value === null || $value === '' || $value === [])) {
                $errors[$id][] = 'This field is required.';
                continue;
            }
            if ($value === null || $value === '') continue;

            $type = $field['type'] ?? 'text';
            $uiType = (string) ($field['ui_type'] ?? $type);
            if ($type === 'number' && !is_numeric($value)) $errors[$id][] = 'Must be a number.';
            if ($type === 'email' && filter_var((string) $value, FILTER_VALIDATE_EMAIL) === false) $errors[$id][] = 'Must be a valid email address.';
            if ($uiType === 'integer' && filter_var($value, FILTER_VALIDATE_INT) === false) $errors[$id][] = 'Must be a whole number.';
            if ($uiType === 'boolean' && !is_bool($value)) $errors[$id][] = 'Must be true or false.';
            if ($uiType === 'url' && filter_var((string) $value, FILTER_VALIDATE_URL) === false) $errors[$id][] = 'Must be a valid URL.';

            $arrayTypes = [
                'weekly_schedule','weekday_multi_select','multi_select','repeatable_text','ordered_list','mapping',
                'repeatable_collection','tags','repeatable_qa','checklist_builder','file_collection','rule_builder',
                'skill_matrix','repeatable_credentials','policy_group','role_channel_matrix','compound_numeric',
                'multi_source_picker','service_rule_matrix','money_pair','compound','long_text_pair','retention_policy',
            ];
            if (in_array($uiType, $arrayTypes, true) && !is_array($value)) {
                $errors[$id][] = 'Must be a structured value.';
            }
            if ($uiType === 'map_radius') {
                if (!is_array($value) || !isset($value['latitude'], $value['longitude'], $value['radius_km']) || !is_numeric($value['latitude']) || !is_numeric($value['longitude']) || !is_numeric($value['radius_km']) || (float) $value['radius_km'] <= 0) {
                    $errors[$id][] = 'Must include latitude, longitude and a positive radius_km.';
                }
            }
            if ($uiType === 'map_polygon' && (!is_array($value) || (($value['coordinates'] ?? $value['geometry']['coordinates'] ?? null) === null))) {
                $errors[$id][] = 'Must include polygon coordinates.';
            }

            if ($uiType === 'secure_connection') {
                if (is_array($value)) {
                    $allowedSecureKeys = ['status','connection_status','connection_reference','state','error_code','checked_at'];
                    foreach (array_keys($value) as $secureKey) {
                        if (!in_array((string) $secureKey, $allowedSecureKeys, true)) {
                            $errors[$id][] = 'Secure connection values may contain status and opaque reference metadata only.';
                            break;
                        }
                    }
                    if (!isset($value['status']) && !isset($value['connection_status']) && !isset($value['connection_reference'])) {
                        $errors[$id][] = 'Secure connection metadata must include status or an opaque connection reference.';
                    }
                } elseif (!is_string($value) && !is_bool($value)) {
                    $errors[$id][] = 'Secure connection state must be status text or structured safe metadata.';
                }
            }

            $min = $field['min'] ?? $field['validation']['min'] ?? null;
            $max = $field['max'] ?? $field['validation']['max'] ?? null;
            if ($min !== null && ((is_numeric($value) && (float) $value < (float) $min) || (is_string($value) && strlen($value) < (int) $min))) $errors[$id][] = "Must be at least {$min}.";
            if ($max !== null && ((is_numeric($value) && (float) $value > (float) $max) || (is_string($value) && strlen($value) > (int) $max))) $errors[$id][] = "Must not exceed {$max}.";

            $allowed = $field['allowed_values'] ?? $field['options'] ?? $field['validation']['in'] ?? null;
            if (is_array($allowed)) {
                if (is_array($value)) {
                    foreach ($value as $selected) {
                        if (!in_array($selected, $allowed, true)) $errors[$id][] = 'Invalid selection.';
                    }
                } elseif (!in_array($value, $allowed, true)) {
                    $errors[$id][] = 'Invalid selection.';
                }
            }
            $regex = $field['regex'] ?? $field['validation']['regex'] ?? null;
            if (is_string($regex) && @preg_match($regex, (string) $value) !== 1) $errors[$id][] = 'Invalid format.';
        }
        return $errors;
    }
}

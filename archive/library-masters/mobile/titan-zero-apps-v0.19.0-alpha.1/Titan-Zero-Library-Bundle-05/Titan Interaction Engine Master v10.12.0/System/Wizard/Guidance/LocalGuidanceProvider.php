<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard\Guidance;

final class LocalGuidanceProvider
{
    public function guidance(array $step, array $data, array $errors = []): string
    {
        if ($errors !== []) {
            $field = (string) array_key_first($errors);
            return "Please correct {$field}: " . implode(' ', $errors[$field]);
        }
        if (!empty($step['guidance']['ai_hint'])) {
            return (string) $step['guidance']['ai_hint'];
        }
        foreach ($step['fields'] ?? [] as $field) {
            $id = (string) ($field['id'] ?? '');
            if (($field['required'] ?? false) && !array_key_exists($id, $data)) {
                return 'Please provide ' . ($field['label'] ?? str_replace('_', ' ', $id)) . '.';
            }
        }
        return (string) ($step['description'] ?? $step['title'] ?? 'Continue to the next step.');
    }
}

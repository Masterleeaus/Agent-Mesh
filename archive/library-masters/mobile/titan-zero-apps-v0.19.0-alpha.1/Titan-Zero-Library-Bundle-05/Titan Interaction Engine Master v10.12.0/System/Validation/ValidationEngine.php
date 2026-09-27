<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Validation;

use App\Extensions\InteractionEngine\System\Contracts\ValidationEngineInterface;
use App\Extensions\InteractionEngine\System\DTO\Question;

class ValidationEngine implements ValidationEngineInterface
{
    public function validate(Question $question, mixed $value, array $context = []): array
    {
        $errors = [];
        $rules = $question->validation;

        if (isset($rules['required']) && $rules['required'] && ($value === null || $value === '')) {
            $errors[] = 'This field is required.';
        }

        if (isset($rules['required_if']) && ($value === null || $value === '')) {
            [$field, $expected] = array_pad(explode(':', (string) $rules['required_if'], 2), 2, null);
            if ($field !== null && $expected !== null && strtolower(trim((string) ($context[$field] ?? ''))) === strtolower(trim((string) $expected))) {
                $errors[] = 'This field is required.';
            }
        }

        if (isset($rules['min'])) {
            if (is_numeric($value) && $value < $rules['min']) {
                $errors[] = "Value must be at least {$rules['min']}.";
            }
            if (is_string($value) && strlen($value) < $rules['min']) {
                $errors[] = "Must be at least {$rules['min']} characters.";
            }
        }

        if (isset($rules['max'])) {
            if (is_numeric($value) && $value > $rules['max']) {
                $errors[] = "Value must not exceed {$rules['max']}.";
            }
            if (is_string($value) && strlen($value) > $rules['max']) {
                $errors[] = "Must not exceed {$rules['max']} characters.";
            }
        }

        if (isset($rules['email']) && $rules['email'] && $value && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Must be a valid email address.';
        }

        if (isset($rules['in']) && is_array($rules['in']) && !in_array($value, $rules['in'])) {
            $errors[] = 'Invalid selection.';
        }

        if (isset($rules['regex']) && $value && !preg_match($rules['regex'], $value)) {
            $errors[] = 'Invalid format.';
        }

        return $errors;
    }
}

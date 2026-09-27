<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Compiler;

final class SchemaValidator
{
    private const INTERACTION_TYPES = ['wizard', 'voice', 'checklist', 'conversation', 'form', 'sop'];
    private const RESPONSE_TYPES = [
        'text', 'email', 'phone', 'address', 'select', 'multi_select', 'boolean',
        'long_text', 'date', 'datetime', 'money', 'number', 'integer', 'file',
        'array', 'repeatable_collection',
    ];
    private const HANDLING_TYPES = ['ask', 'lookup', 'infer', 'predict', 'compute', 'api', 'cache', 'policy', 'local_intelligence', 'device'];

    public function validate(array $definition): void
    {
        $errors = [];
        foreach (['id', 'version', 'name', 'capability', 'sections'] as $field) {
            if (!array_key_exists($field, $definition) || $definition[$field] === '' || $definition[$field] === []) {
                $errors[] = "{$field}: is required";
            }
        }

        $id = (string) ($definition['id'] ?? '');
        if ($id !== '' && preg_match('/^[a-z0-9._-]+$/', $id) !== 1) {
            $errors[] = 'id: must contain only lowercase letters, numbers, dots, underscores or hyphens';
        }
        $version = (string) ($definition['version'] ?? '');
        if ($version !== '' && preg_match('/^\d+\.\d+\.\d+$/', $version) !== 1) {
            $errors[] = 'version: must use semantic version format';
        }
        $capability = (string) ($definition['capability'] ?? '');
        if ($capability !== '' && preg_match('/^[a-z][a-z0-9._-]*$/', $capability) !== 1) {
            $errors[] = 'capability: contains unsupported characters';
        }
        $type = (string) ($definition['type'] ?? 'wizard');
        if (!in_array($type, self::INTERACTION_TYPES, true)) {
            $errors[] = 'type: unsupported interaction type';
        }
        if (isset($definition['permissions']) && !is_array($definition['permissions'])) {
            $errors[] = 'permissions: must be an array';
        }
        if (isset($definition['metadata']) && !is_array($definition['metadata'])) {
            $errors[] = 'metadata: must be an object';
        }

        $sections = $definition['sections'] ?? null;
        if ($sections !== null && !is_array($sections)) {
            $errors[] = 'sections: must be an array';
        } elseif (is_array($sections)) {
            foreach (array_values($sections) as $sectionIndex => $section) {
                $path = "sections.{$sectionIndex}";
                if (!is_array($section)) {
                    $errors[] = "{$path}: must be an object";
                    continue;
                }
                foreach (['id', 'title', 'questions'] as $field) {
                    if (!array_key_exists($field, $section) || $section[$field] === '') {
                        $errors[] = "{$path}.{$field}: is required";
                    }
                }
                if (!isset($section['questions']) || !is_array($section['questions'])) {
                    $errors[] = "{$path}.questions: must be an array";
                    continue;
                }
                foreach (array_values($section['questions']) as $questionIndex => $question) {
                    $questionPath = "{$path}.questions.{$questionIndex}";
                    if (!is_array($question)) {
                        $errors[] = "{$questionPath}: must be an object";
                        continue;
                    }
                    foreach (['key', 'question', 'response_type'] as $field) {
                        if (!array_key_exists($field, $question) || $question[$field] === '') {
                            $errors[] = "{$questionPath}.{$field}: is required";
                        }
                    }
                    $responseType = (string) ($question['response_type'] ?? '');
                    if ($responseType !== '' && !in_array($responseType, self::RESPONSE_TYPES, true)) {
                        $errors[] = "{$questionPath}.response_type: unsupported response type '{$responseType}'";
                    }
                    $handling = (string) ($question['handling'] ?? 'ask');
                    if (!in_array($handling, self::HANDLING_TYPES, true)) {
                        $errors[] = "{$questionPath}.handling: unsupported handling type '{$handling}'";
                    }
                    foreach (['options', 'validation', 'metadata'] as $arrayField) {
                        if (isset($question[$arrayField]) && !is_array($question[$arrayField])) {
                            $errors[] = "{$questionPath}.{$arrayField}: must be an array";
                        }
                    }
                }
            }
        }

        if ($errors !== []) {
            throw new \InvalidArgumentException("Schema validation failed:\n" . implode("\n", $errors));
        }
    }
}

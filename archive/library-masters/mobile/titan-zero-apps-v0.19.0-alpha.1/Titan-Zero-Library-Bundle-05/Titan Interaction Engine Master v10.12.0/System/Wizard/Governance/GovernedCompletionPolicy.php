<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard\Governance;

use App\Extensions\InteractionEngine\System\Wizard\WizardDefinition;

final class GovernedCompletionPolicy
{
    public function assertMayComplete(WizardDefinition $definition, array $data, array $context): void
    {
        $governance = $definition->governance;
        if ($governance === []) {
            return;
        }

        $violations = [];
        foreach ((array) ($governance['required_context'] ?? []) as $field) {
            $field = (string) $field;
            if (!$this->present($context[$field] ?? null)) {
                $violations[] = 'Missing required context: ' . $this->label($field) . '.';
            }
        }

        foreach ((array) ($governance['completion_rules'] ?? []) as $rule) {
            if (!is_array($rule) || !$this->matches((array) ($rule['when'] ?? []), $data, $context)) {
                continue;
            }
            foreach ((array) ($rule['require_fields'] ?? []) as $field) {
                $field = (string) $field;
                if (!$this->present($this->value($data, $field))) {
                    $violations[] = (string) ($rule['message_prefix'] ?? 'Missing required') . ' ' . $this->label($field) . '.';
                }
            }
            foreach ((array) ($rule['require_context'] ?? []) as $field) {
                $field = (string) $field;
                if (!$this->present($this->value($context, $field))) {
                    $violations[] = (string) ($rule['message_prefix'] ?? 'Missing required') . ' context ' . $this->label($field) . '.';
                }
            }
        }

        if ($violations !== []) {
            throw new GovernanceViolation(array_values(array_unique($violations)));
        }
    }

    private function matches(array $when, array $data, array $context): bool
    {
        if ($when === []) {
            return true;
        }
        $source = ($when['source'] ?? 'data') === 'context' ? $context : $data;
        $value = $this->value($source, (string) ($when['field'] ?? ''));

        if (array_key_exists('in', $when)) {
            return in_array($value, (array) $when['in'], true);
        }
        if (array_key_exists('equals', $when)) {
            return $value === $when['equals'];
        }
        if (array_key_exists('gt', $when)) {
            return is_numeric($value) && (float) $value > (float) $when['gt'];
        }
        if (array_key_exists('gte', $when)) {
            return is_numeric($value) && (float) $value >= (float) $when['gte'];
        }
        if (array_key_exists('truthy', $when)) {
            return (bool) $value === (bool) $when['truthy'];
        }

        return false;
    }

    private function value(array $source, string $path): mixed
    {
        if ($path === '') {
            return null;
        }
        $value = $source;
        foreach (explode('.', $path) as $segment) {
            if (!is_array($value) || !array_key_exists($segment, $value)) {
                return null;
            }
            $value = $value[$segment];
        }
        return $value;
    }

    private function present(mixed $value): bool
    {
        return !($value === null || $value === '' || $value === []);
    }

    private function label(string $field): string
    {
        return str_replace('_', ' ', $field);
    }
}

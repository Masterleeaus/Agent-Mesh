<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Compiler;

class ConditionRegistry
{
    private array $conditions = [];

    public function __construct()
    {
        $this->register('isBusiness', function (array $context): bool {
            return strtolower((string) $this->answerValue($context, 'customer_type')) === 'business';
        });
    }

    public function register(string $name, callable $evaluator): void
    {
        $this->conditions[$name] = $evaluator;
    }

    public function evaluate(string $name, array $context): bool
    {
        if (!isset($this->conditions[$name])) {
            throw new \RuntimeException("Condition '{$name}' not found.");
        }
        return (bool) call_user_func($this->conditions[$name], $context);
    }

    public function expand(array $definition): array
    {
        return $definition;
    }

    private function answerValue(array $context, string $key): mixed
    {
        if (array_key_exists($key, $context)) return $context[$key];
        foreach ((array) ($context['answers'] ?? []) as $answer) {
            if (is_array($answer)) {
                $answerKey = $answer['question_key'] ?? $answer['questionKey'] ?? $answer['key'] ?? null;
                if ((string) $answerKey === $key) return $answer['value'] ?? null;
            }
            if (is_object($answer)) {
                $answerKey = $answer->questionKey ?? $answer->question_key ?? $answer->key ?? null;
                if ((string) $answerKey === $key) return $answer->value ?? null;
            }
        }
        return null;
    }
}

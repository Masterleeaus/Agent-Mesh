<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Context\Providers;

use App\Extensions\InteractionEngine\System\Contracts\ContextProviderInterface;

class PolicyContextProvider implements ContextProviderInterface
{
    public function provide(array $state): array
    {
        $user = function_exists('auth') ? auth()->user() : null;
        $total = (float) $this->answer($state, 'total_price', 0);
        return [
            'policy' => [
                'can_create_quote' => $user ? (bool) $user->can('crm.quote.create') : false,
                'can_approve' => $user ? (bool) $user->can('crm.quote.approve') : false,
                'requires_approval' => $total > (float) config('interaction-engine.wizard.approval_threshold', 1000),
            ],
        ];
    }

    private function answer(array $state, string $key, mixed $default = null): mixed
    {
        foreach ($state['answers'] ?? [] as $answer) {
            if (is_object($answer) && ($answer->questionKey ?? null) === $key) {
                return $answer->value;
            }
            if (is_array($answer) && ($answer['question_key'] ?? null) === $key) {
                return $answer['value'] ?? $default;
            }
        }
        return $state['answers'][$key] ?? $default;
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Implementations;

use App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts\DialogueEngineInterface;

final class DialogueEngine implements DialogueEngineInterface
{
    private array $state = ['turn_count' => 0];

    public function process(string $input): string
    {
        $input = trim($input);
        $this->state['last_input'] = $input;
        $this->state['turn_count'] = (int) ($this->state['turn_count'] ?? 0) + 1;
        $lower = strtolower($input);

        if ($input === '') {
            $response = 'Tell me what you need help with for this job or customer.';
            $intent = 'empty';
        } elseif (preg_match('/\b(book|booking|schedule|appointment)\b/', $lower)) {
            $response = 'I can help book the field service. I need the customer, service, location, and preferred time.';
            $intent = 'booking';
        } elseif (preg_match('/\b(quote|price|cost|estimate)\b/', $lower)) {
            $response = 'I can prepare a quote. I need the service scope, site details, and pricing inputs.';
            $intent = 'quote';
        } elseif (str_contains($lower, '?') || preg_match('/^(what|which|how|when|where|who)\b/', $lower)) {
            $response = 'I can answer from the company context or guide you to the relevant field-service workflow.';
            $intent = 'question';
        } else {
            $response = 'I have the request. I can clarify the next field-service action or prepare it for approval.';
            $intent = 'request';
        }
        $this->state['last_intent'] = $intent;
        $this->state['last_response'] = $response;
        return $response;
    }

    public function getState(): array
    {
        return $this->state;
    }

    public function reset(): void
    {
        $this->state = ['turn_count' => 0];
    }
}

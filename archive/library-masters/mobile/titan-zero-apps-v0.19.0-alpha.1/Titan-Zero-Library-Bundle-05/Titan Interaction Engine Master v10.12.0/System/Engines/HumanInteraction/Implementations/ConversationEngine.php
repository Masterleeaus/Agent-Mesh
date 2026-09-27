<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Implementations;

use App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts\ConversationEngineInterface;
class ConversationEngine implements ConversationEngineInterface
{
    private array $history = [];

    public function start(array $context): void
    {
        $this->history = [['role' => 'system', 'content' => 'Conversation started']];
    }

    public function process(string $input): string
    {
        $this->history[] = ['role' => 'user', 'content' => $input];
        $response = $this->generateResponse($input);
        $this->history[] = ['role' => 'assistant', 'content' => $response];
        return $response;
    }

    private function generateResponse(string $input): string
    {
        return "I understand you said: {$input}";
    }

    public function end(): void
    {
        $this->history[] = ['role' => 'system', 'content' => 'Conversation ended'];
    }

    public function getHistory(): array
    {
        return $this->history;
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts;

interface ConversationEngineInterface
{
    public function start(array $context): void;
    public function process(string $input): string;
    public function end(): void;
    public function getHistory(): array;
}

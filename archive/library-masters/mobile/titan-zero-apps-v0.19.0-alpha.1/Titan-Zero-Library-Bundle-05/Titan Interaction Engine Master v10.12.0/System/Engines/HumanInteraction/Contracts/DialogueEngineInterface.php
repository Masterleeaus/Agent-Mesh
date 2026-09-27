<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts;

interface DialogueEngineInterface
{
    public function process(string $input): string;
    public function getState(): array;
    public function reset(): void;
}

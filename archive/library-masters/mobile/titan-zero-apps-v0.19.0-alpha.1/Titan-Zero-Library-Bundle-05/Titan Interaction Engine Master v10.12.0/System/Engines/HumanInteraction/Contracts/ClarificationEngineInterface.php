<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts;

interface ClarificationEngineInterface
{
    public function ask(string $topic): string;
    public function requestMissing(array $required, array $provided): string;
    public function getClarificationHistory(): array;
}

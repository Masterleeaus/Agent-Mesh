<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts;

interface SemanticEngineInterface
{
    public function embed(string $text): array;
    public function understand(string $input): array;
}

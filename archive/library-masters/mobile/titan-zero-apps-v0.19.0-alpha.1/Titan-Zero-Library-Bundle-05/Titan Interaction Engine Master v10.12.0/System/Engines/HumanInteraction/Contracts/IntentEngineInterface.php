<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts;

interface IntentEngineInterface
{
    public function detect(string $input): array;
    public function getConfidence(string $intent): float;
    public function listIntents(): array;
}

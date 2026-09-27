<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts;

interface EmotionEngineInterface
{
    public function detect(string $input): array;
    public function getCurrentEmotion(): string;
    public function listEmotions(): array;
}

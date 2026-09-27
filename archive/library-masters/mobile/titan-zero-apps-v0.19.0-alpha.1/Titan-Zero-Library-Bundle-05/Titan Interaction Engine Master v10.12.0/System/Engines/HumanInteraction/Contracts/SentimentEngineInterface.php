<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts;

interface SentimentEngineInterface
{
    public function analyze(string $input): array;
    public function getSentimentScore(string $input): float;
    public function getPolarity(string $input): string;
}

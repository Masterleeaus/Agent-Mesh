<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Implementations;

use App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts\IntentEngineInterface;
class IntentEngine implements IntentEngineInterface
{
    private array $intents = [
        'greeting' => ['hello', 'hi', 'hey'],
        'inquiry' => ['what', 'how', 'when'],
        'request' => ['need', 'want', 'would like'],
    ];

    public function detect(string $input): array
    {
        $input = strtolower($input);
        foreach ($this->intents as $intent => $keywords) {
            foreach ($keywords as $keyword) {
                if (strpos($input, $keyword) !== false) {
                    return ['intent' => $intent, 'confidence' => 0.8];
                }
            }
        }
        return ['intent' => 'unknown', 'confidence' => 0.2];
    }

    public function getConfidence(string $intent): float
    {
        // Fixed during the fix pass: previously returned a flat 0.5 for
        // every intent regardless of which one was asked about. Derives a
        // real (if simple) per-intent confidence from how many keyword
        // signals that intent is recognized by — more signals, more
        // confidence in a match when it happens.
        if (!isset($this->intents[$intent])) {
            return 0.0;
        }
        $keywordCount = count($this->intents[$intent]);
        return round(min(0.9, 0.4 + ($keywordCount * 0.1)), 2);
    }

    public function listIntents(): array
    {
        return array_keys($this->intents);
    }
}

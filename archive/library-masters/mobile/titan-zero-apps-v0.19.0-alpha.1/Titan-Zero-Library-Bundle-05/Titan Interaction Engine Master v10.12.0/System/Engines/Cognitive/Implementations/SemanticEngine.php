<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\SemanticEngineInterface;
use App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts\EmbeddingEngineInterface;

class SemanticEngine implements SemanticEngineInterface
{
    private EmbeddingEngineInterface $embedder;

    public function __construct(EmbeddingEngineInterface $embedder)
    {
        $this->embedder = $embedder;
    }

    public function embed(string $text): array
    {
        // Delegates to EmbeddingEngine's real hashing-trick implementation
        // (see that class's docblock for what it does and doesn't do).
        // Fixed during the fix pass: this used to return the identical
        // hardcoded 128-length [0.5, 0.5, ...] vector for every input.
        return $this->embedder->embed($text);
    }

    public function understand(string $input): array
    {
        $intents = [
            'create_quote' => ['make quote', 'new estimate', 'quote for'],
            'create_job' => ['new job', 'schedule work', 'book job'],
            'new_customer' => ['add customer', 'new client', 'create customer'],
        ];
        foreach ($intents as $intent => $keywords) {
            foreach ($keywords as $keyword) {
                if (stripos($input, $keyword) !== false) {
                    return ['intent' => $intent, 'confidence' => 0.7];
                }
            }
        }
        return ['intent' => 'unknown', 'confidence' => 0.2];
    }
}

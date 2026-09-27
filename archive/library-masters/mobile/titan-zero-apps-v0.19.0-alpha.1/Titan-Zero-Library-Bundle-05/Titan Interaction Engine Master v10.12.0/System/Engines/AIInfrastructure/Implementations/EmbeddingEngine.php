<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Implementations;

use App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts\EmbeddingEngineInterface;

class EmbeddingEngine implements EmbeddingEngineInterface
{
    private const SIZE = 128;

    public function embed(string $text): array
    {
        $vector = array_fill(0, self::SIZE, 0.0);
        $tokens = preg_split('/[^a-z0-9]+/i', strtolower(trim($text)), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        foreach ($tokens as $token) {
            $hash = hash('sha256', $token, true);
            for ($i = 0; $i < strlen($hash); $i++) {
                $index = (ord($hash[$i]) + ($i * 31)) % self::SIZE;
                $vector[$index] += (ord($hash[$i]) / 255.0) - 0.5;
            }
        }
        $norm = sqrt(array_sum(array_map(static fn(float $value): float => $value * $value, $vector)));
        if ($norm > 0) {
            $vector = array_map(static fn(float $value): float => round($value / $norm, 8), $vector);
        }
        return $vector;
    }

    public function batchEmbed(array $texts): array
    {
        return array_map(fn($text): array => $this->embed((string) $text), $texts);
    }

    public function getEmbeddingSize(): int
    {
        return self::SIZE;
    }
}

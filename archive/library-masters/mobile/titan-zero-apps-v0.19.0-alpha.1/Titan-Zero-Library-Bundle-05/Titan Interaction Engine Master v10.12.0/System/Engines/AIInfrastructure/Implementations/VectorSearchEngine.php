<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Implementations;

use App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts\VectorSearchEngineInterface;

class VectorSearchEngine implements VectorSearchEngineInterface
{
    private array $vectors = [];

    public function search(array $vector, int $k): array
    {
        $results = [];
        foreach ($this->vectors as $id => $candidate) {
            $results[] = ['id' => $id, 'score' => $this->cosine($vector, $candidate), 'vector' => $candidate];
        }
        usort($results, static fn(array $a, array $b): int => $b['score'] <=> $a['score']);
        return array_slice($results, 0, max(0, $k));
    }

    public function index(string $id, array $vector): void
    {
        if ($id === '' || $vector === []) {
            throw new \InvalidArgumentException('Vector id and values are required.');
        }
        foreach ($vector as $value) {
            if (!is_numeric($value)) {
                throw new \InvalidArgumentException('Vectors must contain numeric values only.');
            }
        }
        $this->vectors[$id] = array_map('floatval', array_values($vector));
    }

    public function delete(string $id): void
    {
        unset($this->vectors[$id]);
    }

    private function cosine(array $a, array $b): float
    {
        $length = max(count($a), count($b));
        $dot = $normA = $normB = 0.0;
        for ($i = 0; $i < $length; $i++) {
            $x = (float) ($a[$i] ?? 0);
            $y = (float) ($b[$i] ?? 0);
            $dot += $x * $y;
            $normA += $x * $x;
            $normB += $y * $y;
        }
        return $normA > 0 && $normB > 0 ? $dot / (sqrt($normA) * sqrt($normB)) : 0.0;
    }
}

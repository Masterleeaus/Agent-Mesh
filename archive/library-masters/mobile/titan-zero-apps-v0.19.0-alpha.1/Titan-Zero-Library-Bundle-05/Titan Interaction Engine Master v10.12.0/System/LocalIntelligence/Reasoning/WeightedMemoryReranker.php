<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\LocalIntelligence\Reasoning;

use App\Extensions\InteractionEngine\System\LocalIntelligence\Persona\PersonaSignalAnalyzer;

final class WeightedMemoryReranker
{
    public function __construct(
        private readonly float $semanticWeight = 0.40,
        private readonly float $recencyWeight = 0.40,
        private readonly float $emotionWeight = 0.20,
        private readonly PersonaSignalAnalyzer $signals = new PersonaSignalAnalyzer(),
    ) {
        $sum = $semanticWeight + $recencyWeight + $emotionWeight;
        if (abs($sum - 1.0) > 0.0001) {
            throw new \InvalidArgumentException('Memory reranker weights must sum to 1.0.');
        }
    }

    /**
     * @param list<array<string, mixed>> $candidates
     * @return array<string, mixed>
     */
    public function rank(array $candidates, ?\DateTimeInterface $now = null, int $limit = 5): array
    {
        $now ??= new \DateTimeImmutable();
        $scored = [];
        foreach ($candidates as $index => $candidate) {
            $content = trim((string) ($candidate['content'] ?? ''));
            if ($content === '') {
                continue;
            }
            $semantic = $this->clamp((float) ($candidate['semantic_similarity'] ?? 0.0));
            $timestamp = $this->parseTimestamp($candidate['timestamp'] ?? null, $now);
            $daysOld = max(0.0, ($now->getTimestamp() - $timestamp->getTimestamp()) / 86400.0);
            $recency = 1.0 / ($daysOld + 1.0);
            $emotion = isset($candidate['emotional_intensity'])
                ? $this->clamp((float) $candidate['emotional_intensity'])
                : (float) $this->signals->analyze($content)['emotional_intensity'];
            $score = ($semantic * $this->semanticWeight)
                + ($recency * $this->recencyWeight)
                + ($emotion * $this->emotionWeight);

            $scored[] = array_replace($candidate, [
                'id' => (string) ($candidate['id'] ?? 'memory-' . $index),
                'content' => $content,
                'semantic_score' => round($semantic, 4),
                'recency_score' => round($recency, 4),
                'emotional_score' => round($emotion, 4),
                'score' => round($score, 4),
            ]);
        }

        usort($scored, static function (array $left, array $right): int {
            $score = ($right['score'] <=> $left['score']);
            if ($score !== 0) {
                return $score;
            }
            $time = strcmp((string) ($right['timestamp'] ?? ''), (string) ($left['timestamp'] ?? ''));
            return $time !== 0 ? $time : strcmp((string) $left['id'], (string) $right['id']);
        });
        $scored = array_slice($scored, 0, max(0, $limit));
        $best = $scored[0] ?? null;

        $contradictions = [];
        $alternatives = [];
        if ($best !== null) {
            foreach (array_slice($scored, 1) as $candidate) {
                if ($this->isFactConflict($best, $candidate)) {
                    $contradictions[] = $candidate;
                } else {
                    $alternatives[] = $candidate;
                }
            }
        }

        return [
            'summary' => 'Ranked ' . count($scored) . ' memory candidates.',
            'most_relevant' => $best,
            'contradictions' => $contradictions,
            'alternatives' => $alternatives,
            'weights' => [
                'semantic' => $this->semanticWeight,
                'recency' => $this->recencyWeight,
                'emotion' => $this->emotionWeight,
            ],
        ];
    }

    /** @param array<string, mixed> $left @param array<string, mixed> $right */
    private function isFactConflict(array $left, array $right): bool
    {
        $leftKey = trim((string) ($left['fact_key'] ?? ''));
        $rightKey = trim((string) ($right['fact_key'] ?? ''));
        if ($leftKey === '' || $leftKey !== $rightKey) {
            return false;
        }
        $leftValue = $left['fact_value'] ?? null;
        $rightValue = $right['fact_value'] ?? null;
        return $leftValue !== null && $rightValue !== null && $leftValue !== $rightValue;
    }

    private function parseTimestamp(mixed $value, \DateTimeInterface $fallback): \DateTimeImmutable
    {
        if (!is_string($value) || trim($value) === '') {
            return \DateTimeImmutable::createFromInterface($fallback);
        }
        try {
            return new \DateTimeImmutable($value);
        } catch (\Throwable) {
            return \DateTimeImmutable::createFromInterface($fallback);
        }
    }

    private function clamp(float $value): float
    {
        return max(0.0, min(1.0, $value));
    }
}

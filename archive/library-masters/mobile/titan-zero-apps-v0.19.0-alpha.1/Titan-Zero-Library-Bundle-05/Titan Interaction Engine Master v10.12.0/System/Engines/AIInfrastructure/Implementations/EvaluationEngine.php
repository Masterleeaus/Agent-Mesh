<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Implementations;

use App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts\EvaluationEngineInterface;

/**
 * Word-overlap heuristic scoring — not a learned evaluation model, but
 * genuinely derived from $input/$output rather than a fixed constant.
 * Fixed during the fix pass: evaluate() always returned 0.8 and compare()
 * always declared 'output1' the winner with fixed scores, regardless of
 * either output's actual content.
 */
class EvaluationEngine implements EvaluationEngineInterface
{
    public function evaluate(string $input, string $output): float
    {
        return $this->overlapScore($input, $output);
    }

    public function compare(string $input, string $output1, string $output2): array
    {
        $score1 = $this->overlapScore($input, $output1);
        $score2 = $this->overlapScore($input, $output2);

        return [
            'winner' => $score1 >= $score2 ? 'output1' : 'output2',
            'score1' => $score1,
            'score2' => $score2,
        ];
    }

    public function getEvaluationMetrics(): array
    {
        return ['accuracy', 'relevance', 'coherence'];
    }

    private function overlapScore(string $input, string $output): float
    {
        $inputWords = array_unique(preg_split('/\W+/', strtolower($input), -1, PREG_SPLIT_NO_EMPTY) ?: []);
        $outputWords = array_unique(preg_split('/\W+/', strtolower($output), -1, PREG_SPLIT_NO_EMPTY) ?: []);

        if (empty($inputWords) || empty($outputWords)) {
            return 0.0;
        }

        $overlap = count(array_intersect($inputWords, $outputWords));
        $union = count(array_unique(array_merge($inputWords, $outputWords)));

        return $union > 0 ? round($overlap / $union, 2) : 0.0;
    }
}

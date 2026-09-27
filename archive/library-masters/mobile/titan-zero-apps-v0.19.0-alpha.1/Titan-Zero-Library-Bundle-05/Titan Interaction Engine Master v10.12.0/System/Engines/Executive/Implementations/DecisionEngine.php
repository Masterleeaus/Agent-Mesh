<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Executive\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Executive\Contracts\DecisionEngineInterface;
class DecisionEngine implements DecisionEngineInterface
{
    public function evaluate(array $options, array $criteria): array
    {
        $results = [];
        foreach ($options as $option) {
            $score = 0;
            foreach ($criteria as $criterion => $weight) {
                if (isset($option[$criterion])) {
                    $score += $option[$criterion] * $weight;
                }
            }
            $results[] = ['option' => $option, 'score' => $score];
        }
        usort($results, fn($a, $b) => $b['score'] <=> $a['score']);
        return $results;
    }

    public function decide(array $options, array $criteria): array
    {
        $evaluated = $this->evaluate($options, $criteria);
        return $evaluated[0] ?? ['option' => null, 'score' => 0];
    }

    public function getAlternatives(array $options): array
    {
        return array_slice($options, 1);
    }
}

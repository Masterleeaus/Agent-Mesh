<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\CreativityEngineInterface;

/**
 * Combinatorial idea generation genuinely derived from the given
 * problem/concepts/topic — a lightweight technique (recombination via
 * fixed lenses/templates), not an LLM, and documented as such. Fixed
 * during the fix pass: the original returned identical canned strings
 * ('Idea 1', 'Idea 2', 'Combined concept'...) regardless of input.
 */
class CreativityEngine implements CreativityEngineInterface
{
    private const LENSES = [
        'Simplify: remove a step from "%s"',
        'Automate: what part of "%s" could run without a person?',
        'Combine: pair "%s" with an unrelated capability already in the system',
        'Reverse: what if "%s" worked backwards?',
        'Scale: what breaks about "%s" at 100x volume?',
    ];

    public function generateIdeas(string $problem): array
    {
        if (trim($problem) === '') {
            return [];
        }
        return array_map(fn ($lens) => sprintf($lens, $problem), self::LENSES);
    }

    public function combine(array $concepts): array
    {
        $concepts = array_values(array_filter($concepts, fn ($c) => is_string($c) && $c !== ''));
        if (count($concepts) < 2) {
            return $concepts;
        }

        $combinations = [];
        for ($i = 0; $i < count($concepts); $i++) {
            for ($j = $i + 1; $j < count($concepts); $j++) {
                $combinations[] = "{$concepts[$i]} + {$concepts[$j]}";
            }
        }
        return $combinations;
    }

    public function brainstorm(string $topic): array
    {
        if (trim($topic) === '') {
            return [];
        }
        $angles = ['What', 'Why', 'How', 'Who benefits from', 'What could go wrong with'];
        return array_map(fn ($angle) => "{$angle} {$topic}?", $angles);
    }
}

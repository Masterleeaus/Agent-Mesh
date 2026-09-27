<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Implementations;

use App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts\PromptOptimizationEngineInterface;

/**
 * Rule-based prompt cleanup and scoring — checks for length, specificity
 * markers, and structure rather than returning fixed advice. Fixed during
 * the fix pass: optimize() was a pure passthrough, evaluate() always
 * returned 0.8, and suggestImprovements() always returned the same two
 * strings regardless of $prompt.
 */
class PromptOptimizationEngine implements PromptOptimizationEngineInterface
{
    public function optimize(string $prompt): string
    {
        $optimized = trim(preg_replace('/\s+/', ' ', $prompt) ?? $prompt);
        if ($optimized !== '' && !str_ends_with($optimized, '.') && !str_ends_with($optimized, '?') && !str_ends_with($optimized, ':')) {
            $optimized .= '.';
        }
        return $optimized;
    }

    public function evaluate(string $prompt): float
    {
        $length = strlen(trim($prompt));
        $hasSpecifics = (bool) preg_match('/\b(specifically|exactly|format|example|e\.g\.)\b/i', $prompt);
        $hasQuestion = str_contains($prompt, '?');

        $score = 0.3; // baseline
        $score += min(0.4, $length / 500); // longer, more detailed prompts score higher up to a point
        $score += $hasSpecifics ? 0.2 : 0.0;
        $score += $hasQuestion ? 0.1 : 0.0;

        return round(min(1.0, $score), 2);
    }

    public function suggestImprovements(string $prompt): array
    {
        $suggestions = [];

        if (strlen(trim($prompt)) < 40) {
            $suggestions[] = 'Prompt is short — add more context about what you want.';
        }
        if (!preg_match('/\b(specifically|exactly|format|example|e\.g\.)\b/i', $prompt)) {
            $suggestions[] = 'No specificity markers found — consider stating the desired format or an example.';
        }
        if (!str_contains($prompt, '?') && !preg_match('/^(write|generate|create|list|explain|summarize)/i', trim($prompt))) {
            $suggestions[] = 'Prompt doesn\'t clearly ask a question or give an instruction — state the goal explicitly.';
        }
        if (empty($suggestions)) {
            $suggestions[] = 'Prompt looks reasonably specific already.';
        }

        return $suggestions;
    }
}

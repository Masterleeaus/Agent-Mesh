<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Implementations;

use App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts\ResponseGenerationEngineInterface;

/**
 * Builds response text from the actual $context contents rather than a
 * fixed sentence. Fixed during the fix pass: generate() always returned
 * the identical 'Based on the context, I recommend...' string regardless
 * of $context.
 */
class ResponseGenerationEngine implements ResponseGenerationEngineInterface
{
    public function generate(array $context): string
    {
        if (empty($context)) {
            return "I don't have enough context to respond specifically yet.";
        }

        if (isset($context['recommendation'])) {
            return "Based on what you've shared, I'd suggest: {$context['recommendation']}.";
        }

        if (isset($context['question'])) {
            $answer = $context['answer'] ?? 'let me look into that further';
            return "Regarding \"{$context['question']}\" — {$answer}.";
        }

        $summary = collect($context)
            ->filter(fn ($v) => is_scalar($v))
            ->map(fn ($v, $k) => "{$k}: {$v}")
            ->implode(', ');

        return $summary !== ''
            ? "Based on {$summary}, here's what I found relevant."
            : "I've reviewed the available information but don't have a specific recommendation yet.";
    }

    public function generateWithTemplate(string $template, array $data): string
    {
        return str_replace(array_keys($data), array_values($data), $template);
    }

    public function getResponseType(): string
    {
        return 'informative';
    }
}

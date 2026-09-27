<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\AI;

use App\Extensions\InteractionEngine\System\LocalIntelligence\LocalBrain;

final class LocalBrainGuidanceService implements AIServiceInterface
{
    public function __construct(private readonly LocalBrain $brain) {}

    public function generate(string $prompt, array $options = []): string
    {
        $context = is_array($options['context'] ?? null) ? $options['context'] : [];
        $result = $this->brain->process($prompt, $context);
        $decision = (array) ($result['decision'] ?? []);
        if (($decision['needs_clarification'] ?? true) === true) {
            return 'Please provide the missing details so this can be completed safely.';
        }
        $suggestions = (array) ($result['suggestions'] ?? []);
        return (string) ($suggestions[0] ?? 'Use the matching local workflow with verified data.');
    }
}

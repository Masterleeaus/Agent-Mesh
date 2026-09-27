<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Presentation;

use App\Extensions\InteractionEngine\System\Contracts\InteractionContext;
use App\Extensions\InteractionEngine\System\Contracts\PresentationIntent;
use App\Extensions\InteractionEngine\System\Contracts\PresentationIntentPlannerInterface;

final class DeterministicPresentationIntentPlanner implements PresentationIntentPlannerInterface
{
    public function __construct(private PresentationIntentGuard $guard) {}

    public function plan(InteractionContext $context, string $intent, array $facts = []): PresentationIntent
    {
        $intent = trim($intent);
        if ($intent === '') {
            throw new \InvalidArgumentException('Presentation planning requires an intent.');
        }

        $components = (array)($facts['semantic_components'] ?? []);
        $data = (array)($facts['data_requirements'] ?? []);
        $visual = (array)($facts['visual_hints'] ?? []);
        $actions = (array)($facts['actions'] ?? []);

        $this->guard->validate($components, $data, $visual, $actions);

        return new PresentationIntent(
            $context->surface,
            $intent,
            $components,
            $data,
            $visual,
            $actions,
            'deterministic',
            $context->journey
        );
    }
}

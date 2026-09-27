<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Contracts;

final readonly class PresentationIntent
{
    public function __construct(
        public string $surface,
        public string $purpose,
        public array $semanticComponents = [],
        public array $dataRequirements = [],
        public array $visualHints = [],
        public array $actions = [],
        public string $confidence = 'deterministic',
        public ?string $journey = null
    ) {
        if (!in_array($surface, ['zero', 'go', 'hub'], true)) {
            throw new \InvalidArgumentException('PresentationIntent requires a canonical surface.');
        }
        if (trim($purpose) === '') {
            throw new \InvalidArgumentException('PresentationIntent requires a purpose.');
        }
        foreach ($actions as $action) {
            if (!is_array($action) || trim((string)($action['intent'] ?? '')) === '') {
                throw new \InvalidArgumentException('Presentation actions must be governed intents.');
            }
        }
    }

    public function toArray(): array
    {
        return [
            'schema' => 'titan.apps.presentation-intent.v1',
            'surface' => $this->surface,
            'journey' => $this->journey,
            'purpose' => $this->purpose,
            'semantic_components' => $this->semanticComponents,
            'data_requirements' => $this->dataRequirements,
            'visual_hints' => $this->visualHints,
            'actions' => $this->actions,
            'confidence' => $this->confidence,
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard;

final class WizardSession
{
    public function __construct(
        public string $id,
        public WizardDefinition $definition,
        public int $stepIndex = 0,
        public array $data = [],
        public array $context = [],
        public string $status = 'in_progress',
        public array $history = [],
    ) {}

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'definition' => $this->definition->toArray(),
            'step_index' => $this->stepIndex,
            'data' => $this->data,
            'context' => $this->context,
            'status' => $this->status,
            'history' => $this->history,
        ];
    }

    public static function fromArray(array $data, ?WizardDefinition $definition = null): self
    {
        $definition ??= WizardDefinition::fromArray((array) ($data['definition'] ?? []));
        return new self(
            id: (string) ($data['id'] ?? ''),
            definition: $definition,
            stepIndex: (int) ($data['step_index'] ?? 0),
            data: (array) ($data['data'] ?? []),
            context: (array) ($data['context'] ?? []),
            status: (string) ($data['status'] ?? 'in_progress'),
            history: (array) ($data['history'] ?? []),
        );
    }

    public function currentStep(): ?array
    {
        return $this->definition->step($this->stepIndex);
    }

    public function complete(): bool
    {
        return $this->status === 'completed';
    }
}

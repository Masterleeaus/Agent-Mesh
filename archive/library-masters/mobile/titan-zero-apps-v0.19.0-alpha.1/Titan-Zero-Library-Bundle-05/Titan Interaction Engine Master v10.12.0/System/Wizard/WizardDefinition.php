<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard;

final readonly class WizardDefinition
{
    public function __construct(
        public string $id,
        public string $version,
        public string $name,
        public string $capability,
        public array $steps,
        public array $permissions = [],
        public array $metadata = [],
        public array $offline = [],
        public array $governance = [],
    ) {
        if ($id === '' || $name === '' || $capability === '') {
            throw new \InvalidArgumentException('Wizard id, name and capability are required.');
        }
        if ($steps === []) {
            throw new \InvalidArgumentException('A wizard must contain at least one step.');
        }
        foreach ($steps as $index => $step) {
            if (!is_array($step) || empty($step['id'])) {
                throw new \InvalidArgumentException("Wizard step {$index} must have an id.");
            }
        }
    }

    public static function fromArray(array $definition): self
    {
        $data = $definition['wizard'] ?? $definition;
        return new self(
            id: (string) ($data['id'] ?? ''),
            version: (string) ($data['version'] ?? '1.0.0'),
            name: (string) ($data['name'] ?? ''),
            capability: (string) ($data['capability'] ?? $data['completion']['command'] ?? ''),
            steps: array_values($data['steps'] ?? []),
            permissions: array_values($data['permissions']['required_roles'] ?? $data['permissions'] ?? []),
            metadata: $data['metadata'] ?? [],
            offline: $data['offline'] ?? [],
            governance: (array) ($data['governance'] ?? []),
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'version' => $this->version,
            'name' => $this->name,
            'capability' => $this->capability,
            'steps' => $this->steps,
            'permissions' => ['required_roles' => $this->permissions],
            'metadata' => $this->metadata,
            'offline' => $this->offline,
            'governance' => $this->governance,
        ];
    }

    public function step(int $index): ?array
    {
        return $this->steps[$index] ?? null;
    }

    public function stepCount(): int
    {
        return count($this->steps);
    }
}

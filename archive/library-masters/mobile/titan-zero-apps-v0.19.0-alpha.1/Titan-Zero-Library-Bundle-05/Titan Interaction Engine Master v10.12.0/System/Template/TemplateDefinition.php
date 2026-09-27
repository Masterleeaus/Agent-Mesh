<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Template;

final readonly class TemplateDefinition
{
    public function __construct(
        public string $id,
        public string $version,
        public string $name,
        public string $status,
        public string $category,
        public string $entryWizard,
        public array $capabilities = [],
        public array $channels = [],
        public array $governance = [],
        public array $metadata = [],
    ) {
        if ($id === '' || $name === '' || $entryWizard === '') {
            throw new \InvalidArgumentException('Template id, name and entry wizard are required.');
        }
        if (!preg_match('/^\d+\.\d+\.\d+$/', $version)) {
            throw new \InvalidArgumentException("Template '{$id}' must use a semantic version.");
        }
        if (!in_array($status, ['draft', 'ready', 'deprecated'], true)) {
            throw new \InvalidArgumentException("Template '{$id}' has an invalid status.");
        }
    }

    public static function fromArray(array $definition): self
    {
        $data = (array) ($definition['template'] ?? $definition);
        return new self(
            id: (string) ($data['id'] ?? ''),
            version: (string) ($data['version'] ?? ''),
            name: (string) ($data['name'] ?? ''),
            status: (string) ($data['status'] ?? 'draft'),
            category: (string) ($data['category'] ?? 'general'),
            entryWizard: (string) ($data['entry_wizard'] ?? ''),
            capabilities: array_values(array_map('strval', (array) ($data['capabilities'] ?? []))),
            channels: array_values(array_map('strval', (array) ($data['channels'] ?? []))),
            governance: (array) ($data['governance'] ?? []),
            metadata: (array) ($data['metadata'] ?? []),
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'version' => $this->version,
            'name' => $this->name,
            'status' => $this->status,
            'category' => $this->category,
            'entry_wizard' => $this->entryWizard,
            'capabilities' => $this->capabilities,
            'channels' => $this->channels,
            'governance' => $this->governance,
            'metadata' => $this->metadata,
        ];
    }
}

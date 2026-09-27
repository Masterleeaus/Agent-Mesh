<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Data;

use InvalidArgumentException;

final readonly class DataSourceDefinition
{
    public function __construct(
        public string $id,
        public string $name,
        public string $provider,
        public string $contract,
        public string $requiredCapability,
        public array $fields,
        public array $surfaces,
        public bool $readOnly = true,
    ) {
        if ($provider !== 'crm' || ! str_starts_with($contract, 'crm.') || ! str_starts_with($requiredCapability, 'crm.')) {
            throw new InvalidArgumentException('CRM Builder data sources must use CRM capability/read-model contracts.');
        }
    }

    public static function fromArray(array $definition): self
    {
        return new self(
            (string) ($definition['id'] ?? ''),
            (string) ($definition['name'] ?? ''),
            (string) ($definition['provider'] ?? ''),
            (string) ($definition['contract'] ?? ''),
            (string) ($definition['required_capability'] ?? ''),
            array_values((array) ($definition['fields'] ?? [])),
            array_values((array) ($definition['surface_compatibility'] ?? [])),
            (bool) ($definition['read_only'] ?? false),
        );
    }

    public function toArray(bool $available): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'provider' => $this->provider,
            'read_only' => $this->readOnly,
            'contract' => $this->contract,
            'required_capability' => $this->requiredCapability,
            'fields' => $this->fields,
            'surface_compatibility' => $this->surfaces,
            'available' => $available,
        ];
    }
}

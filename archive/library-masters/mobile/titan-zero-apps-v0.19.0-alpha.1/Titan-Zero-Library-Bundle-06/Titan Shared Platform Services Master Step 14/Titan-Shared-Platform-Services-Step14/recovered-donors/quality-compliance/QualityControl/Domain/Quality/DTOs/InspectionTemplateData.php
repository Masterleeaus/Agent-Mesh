<?php

namespace Modules\QualityControl\Domain\Quality\DTOs;

final class InspectionTemplateData
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $trade = null,
        public readonly ?string $description = null,
        public readonly bool $isActive = true,
        public readonly ?int $passThreshold = null,
        public readonly ?string $serviceType = null,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            name: (string) ($data['name'] ?? ''),
            trade: isset($data['trade']) ? (string) $data['trade'] : null,
            description: isset($data['description']) ? (string) $data['description'] : null,
            isActive: (bool) ($data['is_active'] ?? true),
            passThreshold: isset($data['pass_threshold']) ? (int) $data['pass_threshold'] : null,
            serviceType: isset($data['service_type']) ? (string) $data['service_type'] : null,
        );
    }

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'trade' => $this->trade,
            'description' => $this->description,
            'is_active' => $this->isActive,
            'pass_threshold' => $this->passThreshold,
            'service_type' => $this->serviceType,
        ];
    }
}

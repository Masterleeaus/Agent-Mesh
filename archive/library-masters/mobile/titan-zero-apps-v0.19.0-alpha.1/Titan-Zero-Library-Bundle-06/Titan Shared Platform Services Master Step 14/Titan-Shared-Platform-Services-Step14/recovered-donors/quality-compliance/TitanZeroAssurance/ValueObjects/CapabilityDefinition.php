<?php

declare(strict_types=1);

namespace Modules\TitanZeroAssurance\ValueObjects;

use InvalidArgumentException;

final readonly class CapabilityDefinition
{
    private const RISKS = ['low', 'medium', 'high', 'critical'];

    /** @param list<string> $requiredPermissions */
    public function __construct(
        public string $key,
        public string $label,
        public string $risk,
        public string $handler,
        public array $requiredPermissions = [],
    ) {
        if (trim($key) === '' || trim($label) === '' || trim($handler) === '') {
            throw new InvalidArgumentException('Capability key, label and handler are required.');
        }
        if (!in_array($risk, self::RISKS, true)) {
            throw new InvalidArgumentException('Unsupported capability risk: ' . $risk);
        }
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'label' => $this->label,
            'risk' => $this->risk,
            'handler' => $this->handler,
            'required_permissions' => $this->requiredPermissions,
        ];
    }
}

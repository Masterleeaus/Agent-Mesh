<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Provisioning;

use InvalidArgumentException;

/** Stable transport DTO shared with Titan Mobile; intentionally model-free. */
final readonly class TitanApplicationDefinition
{
    private const SURFACES = ['customer','field','owner','onboarding'];
    public const SCHEMA = 'titan-mobile-application-definition/1';

    public function __construct(private array $payload)
    {
        if (($payload['schema_version'] ?? null) !== self::SCHEMA) {
            throw new InvalidArgumentException('Unsupported Titan Mobile application-definition schema.');
        }
        if (! is_int($payload['company_id'] ?? null) || $payload['company_id'] < 1) {
            throw new InvalidArgumentException('Application definition requires a positive company_id.');
        }
        if (! in_array($payload['surface'] ?? null, self::SURFACES, true)) {
            throw new InvalidArgumentException('Application definition surface is invalid.');
        }
        if (! is_string($payload['product'] ?? null) || trim($payload['product']) === '') {
            throw new InvalidArgumentException('Application definition requires a product display name.');
        }
        foreach (['pages','data_sources','action_intents','notifications'] as $key) {
            if (! is_array($payload[$key] ?? null)) {
                throw new InvalidArgumentException('Application definition field must be an array: '.$key);
            }
        }
        if (isset($payload['credentials']) && $payload['credentials'] !== null) {
            throw new InvalidArgumentException('Application definitions may not contain credentials.');
        }
    }

    public static function fromArray(array $payload): self { return new self($payload); }
    public function toArray(): array { return $this->payload; }
}

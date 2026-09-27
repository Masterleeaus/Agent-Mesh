<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

use InvalidArgumentException;

final class RoutePlanStopInput
{
    /** @param array<string,mixed> $metadata */
    public function __construct(
        public readonly string $id,
        public readonly string $stopType,
        public readonly string $label,
        public readonly Coordinates $coordinates,
        public readonly int $serviceDurationSeconds = 0,
        public readonly ?string $windowStart = null,
        public readonly ?string $windowEnd = null,
        public readonly bool $locked = false,
        public readonly int $originalSequence = 0,
        public readonly ?string $referenceType = null,
        public readonly ?string $publicReferenceId = null,
        public readonly array $metadata = [],
    ) {
        if ($id === '') throw new InvalidArgumentException('Route stop id is required.');
        if (!in_array($stopType, ['depot','job','supplier','contractor','break','custom'], true)) {
            throw new InvalidArgumentException('Unsupported route stop type.');
        }
        if ($serviceDurationSeconds < 0 || $serviceDurationSeconds > 86400) {
            throw new InvalidArgumentException('Route stop service duration is invalid.');
        }
        if (($windowStart === null) xor ($windowEnd === null)) {
            throw new InvalidArgumentException('Appointment windows require both start and end.');
        }
        if ($windowStart !== null && strtotime($windowStart) === false) {
            throw new InvalidArgumentException('Route stop window start is invalid.');
        }
        if ($windowEnd !== null && strtotime($windowEnd) === false) {
            throw new InvalidArgumentException('Route stop window end is invalid.');
        }
        if ($windowStart !== null && strtotime($windowEnd) < strtotime($windowStart)) {
            throw new InvalidArgumentException('Route stop window end must not precede the start.');
        }
    }

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return [
            'id'=>$this->id,'stop_type'=>$this->stopType,'label'=>$this->label,
            'latitude'=>$this->coordinates->latitude,'longitude'=>$this->coordinates->longitude,
            'service_duration_seconds'=>$this->serviceDurationSeconds,'window_start'=>$this->windowStart,
            'window_end'=>$this->windowEnd,'locked'=>$this->locked,'original_sequence'=>$this->originalSequence,
            'reference_type'=>$this->referenceType,'public_reference_id'=>$this->publicReferenceId,'metadata'=>$this->metadata,
        ];
    }
}

<?php

namespace Modules\QualityControl\Domain\Quality\DTOs;

final class RecleanRequestData
{
    public function __construct(
        public readonly int $recordId,
        public readonly ?string $status = null,
        public readonly ?string $dueAt = null,
        public readonly ?string $reason = null,
    ) {
    }
}

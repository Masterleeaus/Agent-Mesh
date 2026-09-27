<?php

namespace Modules\QualityControl\Domain\Quality\DTOs;

final class QcOutcomeData
{
    public function __construct(
        public readonly int $recordId,
        public readonly string $outcome,
        public readonly ?string $severity = null,
        public readonly ?string $notes = null,
    ) {
    }
}

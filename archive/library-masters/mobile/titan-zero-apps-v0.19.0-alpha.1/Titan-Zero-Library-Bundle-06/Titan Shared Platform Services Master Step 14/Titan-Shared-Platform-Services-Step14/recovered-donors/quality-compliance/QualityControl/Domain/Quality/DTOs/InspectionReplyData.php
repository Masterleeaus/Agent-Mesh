<?php

namespace Modules\QualityControl\Domain\Quality\DTOs;

final class InspectionReplyData
{
    public function __construct(
        public readonly int $scheduleId,
        public readonly ?int $userId = null,
        public readonly ?string $comment = null,
        public readonly array $files = [],
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            scheduleId: (int) ($data['schedule_id'] ?? 0),
            userId: isset($data['user_id']) ? (int) $data['user_id'] : null,
            comment: isset($data['comment']) ? (string) $data['comment'] : null,
            files: is_array($data['files'] ?? null) ? $data['files'] : [],
        );
    }
}

<?php

namespace Modules\QualityControl\Domain\Quality\DTOs;

final class ComplaintLinkData
{
    public function __construct(
        public readonly ?int $complaintId = null,
        public readonly ?int $qcRecordId = null,
        public readonly ?int $scheduleId = null,
        public readonly ?int $siteId = null,
        public readonly ?int $teamId = null,
        public readonly ?string $bookingId = null,
    ) {
    }
}

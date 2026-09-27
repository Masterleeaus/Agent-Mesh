<?php

namespace Modules\QualityControl\Domain\Quality\DTOs;

final class QcRecordData
{
    public function __construct(
        public readonly ?string $bookingId = null,
        public readonly ?int $cleanerId = null,
        public readonly ?int $templateId = null,
        public readonly ?int $scheduleId = null,
        public readonly ?string $notes = null,
        public readonly ?string $inspectedAt = null,
        public readonly array $items = [],
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            bookingId: isset($data['booking_id']) ? (string) $data['booking_id'] : null,
            cleanerId: isset($data['cleaner_id']) ? (int) $data['cleaner_id'] : null,
            templateId: isset($data['template_id']) ? (int) $data['template_id'] : null,
            scheduleId: isset($data['schedule_id']) ? (int) $data['schedule_id'] : null,
            notes: isset($data['notes']) ? (string) $data['notes'] : null,
            inspectedAt: isset($data['inspected_at']) ? (string) $data['inspected_at'] : null,
            items: is_array($data['items'] ?? null) ? $data['items'] : [],
        );
    }

    public function toArray(): array
    {
        return [
            'booking_id' => $this->bookingId,
            'cleaner_id' => $this->cleanerId,
            'template_id' => $this->templateId,
            'schedule_id' => $this->scheduleId,
            'notes' => $this->notes,
            'inspected_at' => $this->inspectedAt,
            'items' => $this->items,
        ];
    }
}

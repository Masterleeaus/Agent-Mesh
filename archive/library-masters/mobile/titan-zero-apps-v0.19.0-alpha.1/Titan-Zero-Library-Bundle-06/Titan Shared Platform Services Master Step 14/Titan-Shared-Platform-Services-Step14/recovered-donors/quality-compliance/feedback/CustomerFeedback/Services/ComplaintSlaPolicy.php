<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\Services;

use DateTimeImmutable;
use InvalidArgumentException;

final class ComplaintSlaPolicy
{
    /** @var array<string,int> */
    private array $hours;

    /** @param array<string,int>|null $hours */
    public function __construct(?array $hours = null)
    {
        $this->hours = $hours ?? ['critical' => 4, 'high' => 24, 'medium' => 72, 'low' => 120];
    }

    public function hoursForPriority(string $priority): int
    {
        if (!isset($this->hours[$priority])) {
            throw new InvalidArgumentException('Unsupported complaint priority: ' . $priority);
        }
        return (int) $this->hours[$priority];
    }

    public function dueAt(string $priority, ?DateTimeImmutable $from = null): DateTimeImmutable
    {
        $from ??= new DateTimeImmutable();
        return $from->modify('+' . $this->hoursForPriority($priority) . ' hours');
    }
}

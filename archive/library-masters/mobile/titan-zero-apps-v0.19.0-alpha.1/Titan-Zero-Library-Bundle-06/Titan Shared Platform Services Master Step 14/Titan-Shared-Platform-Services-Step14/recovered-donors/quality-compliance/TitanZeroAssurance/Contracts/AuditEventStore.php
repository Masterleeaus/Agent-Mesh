<?php

declare(strict_types=1);
namespace Modules\TitanZeroAssurance\Contracts;
use Modules\TitanZeroAssurance\ValueObjects\AuditEvent;
interface AuditEventStore { public function append(AuditEvent $event): void; public function findByEventId(int $companyId, string $eventId): ?array; public function between(int $companyId, string $from, string $to, int $limit = 5000): array; }

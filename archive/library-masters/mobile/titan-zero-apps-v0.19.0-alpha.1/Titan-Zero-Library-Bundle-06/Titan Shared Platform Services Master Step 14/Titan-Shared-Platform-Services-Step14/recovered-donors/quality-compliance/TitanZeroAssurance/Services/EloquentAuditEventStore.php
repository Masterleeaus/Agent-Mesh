<?php

declare(strict_types=1);
namespace Modules\TitanZeroAssurance\Services;
use Modules\TitanZeroAssurance\Contracts\AuditEventStore;
use Modules\TitanZeroAssurance\Entities\AssuranceAuditEvent;
use Modules\TitanZeroAssurance\ValueObjects\AuditEvent;
final class EloquentAuditEventStore implements AuditEventStore {
 public function append(AuditEvent $event): void { $d=$event->toArray(); AssuranceAuditEvent::query()->firstOrCreate(['event_id'=>$event->eventId,'company_id'=>$event->companyId],[
  'action'=>$event->action,'outcome'=>$event->outcome,'subject_type'=>$event->subjectType,'subject_id'=>$event->subjectId,'actor_type'=>$event->actorType,'actor_id'=>$event->actorId,
  'correlation_id'=>$event->correlationId,'causation_id'=>$event->causationId,'idempotency_key'=>$event->idempotencyKey,'occurred_at'=>$event->occurredAt,'evidence_json'=>$d['evidence'],'metadata_json'=>$event->metadata]); }
 public function between(int $companyId,string $from,string $to,int $limit=5000):array { return AssuranceAuditEvent::query()->where('company_id',$companyId)->whereBetween('occurred_at',[$from,$to])->orderBy('occurred_at')->limit($limit)->get()->map->toArray()->all(); }
 public function findByEventId(int $companyId,string $eventId): ?array { $row=AssuranceAuditEvent::query()->where('company_id',$companyId)->where('event_id',$eventId)->first(); return $row?->toArray(); }
}

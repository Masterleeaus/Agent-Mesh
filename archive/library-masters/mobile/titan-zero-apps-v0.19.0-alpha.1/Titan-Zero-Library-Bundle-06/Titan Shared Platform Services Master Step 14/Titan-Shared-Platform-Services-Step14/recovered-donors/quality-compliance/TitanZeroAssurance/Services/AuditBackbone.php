<?php

declare(strict_types=1);
namespace Modules\TitanZeroAssurance\Services;
use Modules\TitanZeroAssurance\Contracts\AuditEventStore;
use Modules\TitanZeroAssurance\ValueObjects\AuditEvent;
use Modules\TitanZeroAssurance\ValueObjects\EvidenceRef;
final class AuditBackbone {
 public function __construct(private AuditEventStore $store, private ExecutionContextStore $contexts) {}
 public function record(string $action,string $outcome,string $subjectType,string|int $subjectId,array $evidence=[],array $metadata=[]): AuditEvent {
  foreach($evidence as $ref) if(!$ref instanceof EvidenceRef) throw new \InvalidArgumentException('Audit evidence must contain EvidenceRef values.');
  $event=AuditEvent::fromContext($this->contexts->require(),$action,$outcome,$subjectType,(string)$subjectId,$evidence,$metadata); $this->store->append($event); return $event;
 }
}

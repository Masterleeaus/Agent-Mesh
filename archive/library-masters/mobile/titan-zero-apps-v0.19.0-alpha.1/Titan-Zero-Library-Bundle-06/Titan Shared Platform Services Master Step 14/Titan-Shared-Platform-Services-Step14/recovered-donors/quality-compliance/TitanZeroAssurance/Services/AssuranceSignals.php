<?php
declare(strict_types=1);
namespace Modules\TitanZeroAssurance\Services;
use Modules\TitanZeroAssurance\ValueObjects\SignalEnvelope;
final class AssuranceSignals {
 public function __construct(private ExecutionContextStore $contexts,private AssuranceOrchestrator $orchestrator){}
 public function emit(string $signal,string $subjectType,string|int $subjectId,array $evidence=[],array $metadata=[],array $capabilities=[]):array {$envelope=SignalEnvelope::fromContext($this->contexts->require(),$signal,$subjectType,(string)$subjectId,$evidence,$metadata);return $this->orchestrator->process($envelope,$capabilities);}
}
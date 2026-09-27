<?php
declare(strict_types=1);
namespace Modules\TitanZeroAssurance\Services;
use Modules\TitanZeroAssurance\Contracts\AssuranceSignalHandler;use Modules\TitanZeroAssurance\ValueObjects\AssuranceFinding;use Modules\TitanZeroAssurance\ValueObjects\SignalEnvelope;use Modules\TitanZeroAssurance\ValueObjects\WorkItemRequest;use Modules\TitanZeroAssurance\Support\Identifier;
final class AssuranceOrchestrator {
 /** @param iterable<AssuranceSignalHandler> $handlers */
 public function __construct(private AuditBackbone $audit,private GovernedWorkItemRouter $work,private iterable $handlers=[]){}
 public function process(SignalEnvelope $signal,array $grantedCapabilities=[]):array {
  $signalAudit=$this->audit->record('assurance.signal.received','accepted',$signal->subjectType,$signal->subjectId,$signal->evidence,['signal'=>$signal->toArray()]);
  $results=[];$findings=[];$work=[];
  foreach($this->handlers as$handler){if(!$handler->supports($signal))continue;$result=$handler->handle($signal);$results[]=$result;foreach(($result['findings']??[])as$f){if(!$f instanceof AssuranceFinding)throw new \LogicException('Assurance handlers must return AssuranceFinding values.');if($f->companyId!==$signal->companyId)throw new \LogicException('Cross-company assurance finding rejected.');$findings[]=$f;$this->audit->record('assurance.finding.created','open',$f->subjectType,$f->subjectId,$f->evidence,['finding'=>$f->toArray(),'caused_by_signal'=>$signal->signalId]);foreach(($result['work']??[])as$w){if(!$w instanceof WorkItemRequest)throw new \LogicException('Assurance handler work must contain WorkItemRequest values.');if($w->companyId!==$signal->companyId)throw new \LogicException('Cross-company assurance work rejected.');$work[]=$this->work->route($w,$grantedCapabilities);}}}
  return ['signal'=>$signal,'audit_event'=>$signalAudit,'findings'=>$findings,'work'=>$work,'handler_results'=>$results];
 }
 public function verifyOutcome(SignalEnvelope $source,string $subjectType,string|int $subjectId,string $outcome,array $evidence=[]):array {$event=$this->audit->record('assurance.outcome.verified',$outcome,$subjectType,(string)$subjectId,$evidence,['source_signal_id'=>$source->signalId,'correlation_id'=>$source->correlationId]);return ['status'=>'verified','audit_event'=>$event];}
}
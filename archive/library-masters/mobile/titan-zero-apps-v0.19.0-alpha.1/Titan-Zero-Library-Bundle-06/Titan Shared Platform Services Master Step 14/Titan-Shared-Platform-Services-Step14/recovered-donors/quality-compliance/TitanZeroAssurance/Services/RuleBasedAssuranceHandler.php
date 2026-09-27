<?php
declare(strict_types=1);
namespace Modules\TitanZeroAssurance\Services;
use Modules\TitanZeroAssurance\Contracts\AssuranceSignalHandler;use Modules\TitanZeroAssurance\Support\Identifier;use Modules\TitanZeroAssurance\ValueObjects\AssuranceFinding;use Modules\TitanZeroAssurance\ValueObjects\SignalEnvelope;use Modules\TitanZeroAssurance\ValueObjects\WorkItemRequest;
final class RuleBasedAssuranceHandler implements AssuranceSignalHandler {
 public function supports(SignalEnvelope $s):bool{return in_array($s->signal,['quality.failed','quality.reclean_required','feedback.complaint_received','feedback.complaint_escalated','trust.incident_reported','compliance.integrity_mismatch'],true);}
 public function handle(SignalEnvelope $s):array {$map=[
 'quality.failed'=>['high','Quality check failed','quality_corrective_action','investigate_quality_failure','quality.corrective.manage'],
 'quality.reclean_required'=>['high','Re-clean required','quality_corrective_action','authorise_reclean','quality.corrective.manage'],
 'feedback.complaint_received'=>['medium','Customer complaint received','customer_resolution','investigate_complaint','feedback.resolve'],
 'feedback.complaint_escalated'=>['high','Customer complaint escalated','customer_resolution','resolve_escalated_complaint','feedback.resolve'],
 'trust.incident_reported'=>['high','Field incident reported','incident_response','investigate_incident','evidence.review'],
 'compliance.integrity_mismatch'=>['critical','Audit integrity mismatch','compliance_corrective_action','investigate_compliance_exception','compliance.corrective.manage']];[$sev,$title,$type,$action,$cap]=$map[$s->signal];$f=new AssuranceFinding(Identifier::uuidV4(),$s->companyId,strtok($s->signal,'.'),$sev,$title,$s->subjectType,$s->subjectId,'open',$s->evidence,['signal_id'=>$s->signalId,'signal'=>$s->signal,'correlation_id'=>$s->correlationId]+$s->metadata);$w=WorkItemRequest::fromFinding($f,$type,$action,in_array($sev,['high','critical'],true)?'high':'medium',[$cap],['source_signal'=>$s->toArray()],$s->correlationId,$s->idempotencyKey?($s->idempotencyKey.':work'):'assurance:'.$s->signalId.':work');return ['findings'=>[$f],'work'=>[$w]];}
}
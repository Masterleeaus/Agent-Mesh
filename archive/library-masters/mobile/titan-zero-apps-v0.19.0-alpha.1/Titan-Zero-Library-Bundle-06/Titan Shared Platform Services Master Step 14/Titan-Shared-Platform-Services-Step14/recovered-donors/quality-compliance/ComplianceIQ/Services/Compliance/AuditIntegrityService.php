<?php
declare(strict_types=1);
namespace Modules\ComplianceIQ\Services\Compliance;
use Modules\ComplianceIQ\Entities\ComplianceHash;use Modules\TitanZeroAssurance\Contracts\AuditEventStore;use Modules\TitanZeroAssurance\ValueObjects\AuditEvent;
final class AuditIntegrityService {
 public function hashEvent(AuditEvent $event,?string $previous=null):string {return hash('sha256',json_encode(['previous'=>$previous,'event'=>$event->toArray()],JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR));}
 public function record(AuditEvent $event):ComplianceHash {$prev=ComplianceHash::query()->where('company_id',$event->companyId)->latest('id')->value('sha256');$sha=$this->hashEvent($event,$prev);return ComplianceHash::query()->create(['company_id'=>$event->companyId,'hashable_type'=>'audit_event','hashable_id'=>$event->eventId,'sha256'=>$sha,'previous_sha256'=>$prev,'computed_at'=>now(),'status'=>'valid']);}
 public function verifyCompany(int $companyId):array {$prev=null;$checked=0;$mismatch=[];ComplianceHash::query()->where('company_id',$companyId)->where('hashable_type','audit_event')->orderBy('id')->each(function($row)use(&$prev,&$checked,&$mismatch){$checked++;if($row->previous_sha256!==$prev)$mismatch[]=(int)$row->id;$prev=$row->sha256;});return ['company_id'=>$companyId,'checked'=>$checked,'valid'=>$mismatch===[],'mismatches'=>$mismatch,'integrity_root'=>$prev];}
}
<?php
declare(strict_types=1);
namespace Modules\ComplianceIQ\Services\Compliance;
use Modules\TitanZeroAssurance\Support\Identifier;use Modules\TitanZeroAssurance\ValueObjects\AssuranceFinding;use Modules\TitanZeroAssurance\ValueObjects\EvidenceRef;use Modules\TitanZeroAssurance\ValueObjects\WorkItemRequest;
final class ComplianceFindingService {
 public function finding(int $companyId,string $severity,string $title,string $subjectType,string|int $subjectId,array $evidence=[],array $metadata=[]):AssuranceFinding {return new AssuranceFinding(Identifier::uuidV4(),$companyId,'compliance',$severity,$title,$subjectType,(string)$subjectId,'open',$evidence,$metadata);}
 public function correctiveWork(AssuranceFinding $finding,string $action='investigate_compliance_exception'):WorkItemRequest {$risk=in_array($finding->severity,['high','critical'],true)?'high':'medium';return WorkItemRequest::fromFinding($finding,'compliance_corrective_action',$action,$risk,['compliance.corrective.manage'],['finding'=>$finding->toArray()],null,'compliance:'.$finding->findingId.':'.$action);}
}
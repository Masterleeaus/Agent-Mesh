<?php
declare(strict_types=1);
namespace Modules\ComplianceIQ\Services\Compliance;
use Modules\ComplianceIQ\Entities\ComplianceReport;use Modules\TitanZeroAssurance\Contracts\AuditEventStore;use Modules\TitanZeroAssurance\Services\ExecutionContextStore;
final class ComplianceReportService {
 public function __construct(private AuditEventStore $audit,private ExecutionContextStore $contexts,private AuditIntegrityService $integrity){}
 public function build(ComplianceReport $report):array {$ctx=$this->contexts->require();if((int)$report->company_id!==$ctx->companyId)throw new \LogicException('Cross-company compliance report access denied.');$events=$this->audit->between($ctx->companyId,$report->period_start->startOfDay()->toAtomString(),$report->period_end->endOfDay()->toAtomString());$actions=[];$outcomes=[];foreach($events as$e){$actions[$e['action']]=($actions[$e['action']]??0)+1;$outcomes[$e['outcome']]=($outcomes[$e['outcome']]??0)+1;}$iv=$this->integrity->verifyCompany($ctx->companyId);return ['company_id'=>$ctx->companyId,'period'=>[$report->period_start->toDateString(),$report->period_end->toDateString()],'event_count'=>count($events),'actions'=>$actions,'outcomes'=>$outcomes,'integrity'=>$iv];}
}
<?php
namespace Modules\ComplianceIQ\Jobs;
use Illuminate\Bus\Queueable;use Illuminate\Contracts\Queue\ShouldQueue;use Illuminate\Foundation\Bus\Dispatchable;use Modules\ComplianceIQ\Services\Compliance\AuditIntegrityService;use Modules\TitanZeroAssurance\Services\ExecutionContextStore;use Modules\TitanZeroAssurance\ValueObjects\CompanyExecutionContext;
class TamperCheckHashes implements ShouldQueue {use Dispatchable,Queueable;public function __construct(public int $companyId){}public function handle(AuditIntegrityService $integrity,ExecutionContextStore $contexts):void {$contexts->runWith(new CompanyExecutionContext($this->companyId,'system','compliance-integrity'),fn()=> $integrity->verifyCompany($this->companyId));}}

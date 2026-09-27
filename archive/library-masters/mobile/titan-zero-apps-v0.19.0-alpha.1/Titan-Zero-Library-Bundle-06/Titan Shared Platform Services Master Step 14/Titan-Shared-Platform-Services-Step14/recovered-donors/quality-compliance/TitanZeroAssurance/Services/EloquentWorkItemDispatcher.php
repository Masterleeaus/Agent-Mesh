<?php
declare(strict_types=1);
namespace Modules\TitanZeroAssurance\Services;
use Modules\TitanZeroAssurance\Contracts\WorkItemDispatcher;use Modules\TitanZeroAssurance\Entities\AssuranceWorkItem;use Modules\TitanZeroAssurance\ValueObjects\WorkItemRequest;
final class EloquentWorkItemDispatcher implements WorkItemDispatcher {
 public function dispatch(WorkItemRequest $r):string {$row=AssuranceWorkItem::query()->firstOrCreate(['company_id'=>$r->companyId,'idempotency_key'=>$r->idempotencyKey ?: $r->requestId],['request_id'=>$r->requestId,'work_type'=>$r->workType,'action'=>$r->action,'risk'=>$r->risk,'status'=>'queued','required_capabilities'=>$r->requiredCapabilities,'payload_json'=>$r->payload,'correlation_id'=>$r->correlationId]);return (string)$row->request_id;}
}
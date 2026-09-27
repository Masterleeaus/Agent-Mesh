<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\DispatchAssignmentGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialCommandBusGateway;
use App\Extensions\TitanMapsIntelligence\DTO\DispatchJobContext;

final class CrmDispatchAssignmentGateway implements DispatchAssignmentGateway
{
    public function __construct(
        private readonly SpatialCommandBusGateway $commandBus,
        private readonly SpatialExecutionContextFactory $contextFactory,
        private readonly SpatialExecutionContextStore $executionContexts,
    ) {}

    public function assign(string $companyId, DispatchJobContext $job, array $candidate, array $options=[]): array
    {
        if (!$this->commandBus->available()) return ['status'=>'unavailable','reference'=>null,'reason'=>'command_bus_unavailable'];
        $worker=trim((string)($candidate['worker_user_id']??''));
        if($worker==='') return ['status'=>'denied','reference'=>null,'reason'=>'worker_reference_missing'];
        $context=$this->executionContexts->current() ?? $this->contextFactory->fromInput('job.assign',[
            'trace_id'=>$options['trace_id']??null,'correlation_id'=>$options['correlation_id']??($options['recommendation_id']??null),
            'causation_id'=>$options['causation_id']??null,'agent_id'=>$options['agent_id']??null,'conversation_id'=>$options['conversation_id']??null,
            'execution_origin'=>$options['execution_origin']??'human',
        ]);
        if(!hash_equals($context->companyId,$companyId)) return ['status'=>'denied','reference'=>null,'reason'=>'tenant_mismatch'];
        $payload=[
            'job_public_id'=>$job->publicId,'worker_user_id'=>$worker,'scheduled_start'=>$job->scheduledStart,'scheduled_end'=>$job->scheduledEnd,
            'recommendation_id'=>$options['recommendation_id']??null,'actor_user_id'=>$options['actor_user_id']??null,
        ];
        $idempotency='maps:job.assign:'.hash('sha256',$companyId.'|'.$job->publicId.'|'.$worker.'|'.(string)($options['recommendation_id']??''));
        $result=$this->commandBus->execute($context,'job.assign',$payload,$idempotency);
        if(($result['ok']??false)!==true) return ['status'=>'failed','reference'=>$result['receipt_id']??null,'message'=>$result['error']['message']??'Command Bus assignment failed.'];
        return ['status'=>'assigned','reference'=>$result['receipt_id']??null,'record'=>$result['data']??null];
    }
}

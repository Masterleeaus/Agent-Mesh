<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\DispatchAssignmentGateway;
use App\Extensions\TitanMapsIntelligence\DTO\DispatchJobContext;
use Illuminate\Contracts\Container\Container;

/** Maps may request a Field assignment only through Titan Field's governed FieldCommandGateway. */
final class TitanFieldDispatchAssignmentGateway implements DispatchAssignmentGateway
{
    private const FIELD_GATEWAY='App\\Extensions\\TitanField\\System\\Contracts\\FieldCommandGateway';
    public function __construct(private readonly Container $app) {}

    public function assign(string $companyId, DispatchJobContext $job, array $candidate, array $options=[]): array
    {
        if(!ctype_digit($companyId)||!interface_exists(self::FIELD_GATEWAY)||!$this->app->bound(self::FIELD_GATEWAY))return ['status'=>'unavailable','reference'=>null,'reason'=>'titan_field_governed_gateway_unavailable'];
        $worker=trim((string)($candidate['worker_user_id']??'')); if($worker===''||!ctype_digit($worker))return ['status'=>'denied','reference'=>null,'reason'=>'worker_reference_missing'];
        $actor=trim((string)($options['actor_user_id']??auth()->id()??'')); if($actor===''||!ctype_digit($actor))return ['status'=>'denied','reference'=>null,'reason'=>'actor_reference_missing'];
        /** @var object $gateway */ $gateway=$this->app->make(self::FIELD_GATEWAY);
        $idempotency='maps:governed:dispatch:'.hash('sha256',$companyId.'|'.$job->publicId.'|'.$worker.'|'.(string)($options['recommendation_id']??''));
        $data=['work_order_public_id'=>$job->publicId,'worker_user_id'=>(int)$worker,'scheduled_start'=>$job->scheduledStart,'scheduled_end'=>$job->scheduledEnd,'timezone'=>$options['timezone']??null,'metadata'=>['maps_recommendation_id'=>$options['recommendation_id']??null]];
        $receipt=$gateway->execute((int)$actor,(int)$actor,'titan.field.dispatch','assign_dispatch',['work_order_public_id'=>$job->publicId,'worker_user_id'=>(int)$worker,'data'=>$data],[
            'source'=>'titan-maps-intelligence','idempotency_key'=>$idempotency,'trace_id'=>$options['trace_id']??null,'correlation_id'=>$options['correlation_id']??null,'causation_id'=>$options['causation_id']??null,
        ]);
        return ['status'=>'assigned','reference'=>$receipt['command_id']??null,'record'=>$receipt,'governed'=>true];
    }
}

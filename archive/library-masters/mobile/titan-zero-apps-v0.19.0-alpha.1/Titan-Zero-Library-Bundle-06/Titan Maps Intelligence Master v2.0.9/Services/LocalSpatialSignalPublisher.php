<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Services;
use App\Extensions\TitanMapsIntelligence\Contracts\AuditRecorder;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialSignalPublisher;
use App\Extensions\TitanMapsIntelligence\DTO\SpatialExecutionContext;
final class LocalSpatialSignalPublisher implements SpatialSignalPublisher
{
    public function __construct(private readonly AuditRecorder $audit) {}
    public function publish(string $eventType,SpatialExecutionContext $context,array $payload=[]): ?string
    {
        $id='maps-local-signal-'.substr(hash('sha256',$eventType.'|'.$context->traceId.'|'.microtime(true)),0,24);
        $this->audit->record([
            'record_type'=>'spatial_signal_fallback','event_id'=>$id,'event_type'=>$eventType,
            'trace_id'=>$context->traceId,'correlation_id'=>$context->correlationId,'causation_id'=>$context->causationId,
            'company_id'=>$context->companyId,'capability_id'=>$context->capabilityId,'origin'=>$context->origin,
            'payload'=>$payload,'platform_signal_published'=>false,
        ]);
        return $id;
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\DTO\SpatialExecutionContext;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;

final class SpatialExecutionContextFactory
{
    private const ORIGINS = ['human','ai','system','offline_sync'];

    public function __construct(private readonly AuthorisedCompanyContext $context) {}

    public function fromInput(string $capabilityId, array $input): SpatialExecutionContext
    {
        foreach (['company_id','tenant_id'] as $key) {
            if (array_key_exists($key,$input)) {
                throw MapsIntelligenceException::fromCode('MAPS_TENANT_OVERRIDE_DENIED','Client-supplied tenant context is not accepted by Maps capabilities.',['field'=>$key]);
            }
        }
        $trace=$this->identifier($input['trace_id']??null) ?? $this->newId('trace');
        $correlation=$this->identifier($input['correlation_id']??null) ?? $trace;
        $causation=$this->identifier($input['causation_id']??null);
        $agent=$this->identifier($input['agent_id']??null);
        $origin=(string)($input['execution_origin']??($agent!==null?'ai':'human'));
        if(!in_array($origin,self::ORIGINS,true)) {
            throw MapsIntelligenceException::fromCode('MAPS_EXECUTION_ORIGIN_INVALID','Unsupported spatial execution origin.',['origin'=>$origin]);
        }
        return new SpatialExecutionContext(
            traceId:$trace,correlationId:$correlation,causationId:$causation,
            companyId:$this->context->companyId(),userId:$this->context->userId(),agentId:$agent,
            conversationId:$this->identifier($input['conversation_id']??null),capabilityId:$capabilityId,origin:$origin,
        );
    }

    private function identifier(mixed $value): ?string
    {
        if(!is_scalar($value)) return null;
        $v=trim((string)$value);
        return $v===''?null:substr($v,0,255);
    }

    private function newId(string $prefix): string
    {
        return $prefix.'-'.bin2hex(random_bytes(16));
    }
}

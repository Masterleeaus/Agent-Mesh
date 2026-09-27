<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Capabilities\Integrations;

use App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\BuilderCapabilityGatewayInterface;
use App\Extensions\TitanBuilder\System\Contracts\PreviewRenderer;
use App\Extensions\TitanBuilder\System\Contracts\Publisher;

/** Adapter for contracts verified in Titan Builder 1.0.0. */
final class BuilderCurrentGatewayAdapter implements BuilderCapabilityGatewayInterface
{
    public function __construct(
        private readonly ?PreviewRenderer $preview = null,
        private readonly ?Publisher $publisher = null,
    ) {}

    public function supportedCapabilities(): array
    {
        $caps=[];
        if($this->preview!==null)$caps[]='builder.preview';
        if($this->publisher!==null){$caps[]='builder.publish';$caps[]='builder.rollback';}
        return $caps;
    }

    public function available(string $capability, CapabilityExecutionContext $context): bool
    {
        if (!in_array($capability, $this->supportedCapabilities(), true) || $context->companyId === '') return false;
        if (in_array($capability, ['builder.publish','builder.rollback'], true)) {
            // Titan Builder 1.0.0 Publisher currently declares int $companyId.
            return ctype_digit($context->companyId);
        }
        return true;
    }

    public function execute(string $capability, array $payload, CapabilityExecutionContext $context): array
    {
        return match($capability){
            'builder.preview' => ['status'=>'executed','data'=>$this->preview?->render((array)($payload['spec']??[]),array_replace((array)($payload['context']??[]),['company_id'=>$context->companyId,'actor_id'=>$context->actorId,'correlation_id'=>$context->correlationId]))],
            'builder.publish' => ['status'=>'executed','data'=>$this->normalise($this->publisher?->publish($context->companyId,(int)($payload['project_id']??0),$context->actorId))],
            'builder.rollback' => ['status'=>'executed','data'=>$this->normalise($this->publisher?->rollback($context->companyId,(int)($payload['project_id']??0),(int)($payload['snapshot_id']??0),$context->actorId))],
            default => ['status'=>'unavailable','reason'=>'Titan Builder 1.0.0 does not expose this capability through a verified public contract.'],
        };
    }

    public function readiness(CapabilityExecutionContext $context): array
    {
        return ['status'=>$this->supportedCapabilities()!==[]?'warning':'blocked','reason'=>$this->supportedCapabilities()!==[]?'Verified preview/publish contracts are available; application provisioning gateway is not yet published.':'Titan Builder public contracts are not bound.','details'=>['company_id'=>$context->companyId,'capabilities'=>$this->supportedCapabilities()]];
    }

    private function normalise(mixed $value): mixed
    {
        return is_object($value)&&method_exists($value,'toArray')?$value->toArray():$value;
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Capabilities\Integrations;

use App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\ConnectCapabilityGatewayInterface;
use App\Extensions\TitanConnect\System\Contracts\MessagingToolGateway;

/** Adapter for Titan Connect 0.7 MessagingToolGateway. Credentials never enter this adapter. */
final class ConnectCurrentGatewayAdapter implements ConnectCapabilityGatewayInterface
{
    private const SEND_CAPABILITIES=['communications.customer.send','communications.work_order.send_update','communications.booking.send_confirmation','communications.invoice.send'];
    public function __construct(private readonly MessagingToolGateway $gateway){}
    public function supportedCapabilities():array{return self::SEND_CAPABILITIES;}
    public function available(string $capability,CapabilityExecutionContext $context):bool{return in_array($capability,self::SEND_CAPABILITIES,true)&&ctype_digit($context->companyId)&&ctype_digit($context->actorId);}
    public function execute(string $capability,array $payload,CapabilityExecutionContext $context):array
    {
        if(!in_array($capability,self::SEND_CAPABILITIES,true))return['status'=>'unavailable','reason'=>'Titan Connect public gateway does not expose this capability.'];
        foreach(['connection_uuid','thread_uuid','recipient','body'] as$key)if(trim((string)($payload[$key]??''))==='')return['status'=>'validation_failed','reason'=>"{$key} is required."];
        $idempotency=$context->idempotencyKey??trim((string)($payload['idempotency_key']??''));
        if($idempotency==='')return['status'=>'validation_failed','reason'=>'Trusted idempotency_key is required for external delivery.'];
        $data=$this->gateway->externalSend((int)$context->companyId,(int)$context->actorId,(string)$payload['connection_uuid'],(string)$payload['thread_uuid'],(string)$payload['recipient'],(string)$payload['body'],$idempotency);
        return['status'=>'executed','data'=>$data];
    }
    public function readiness(CapabilityExecutionContext $context):array{return['status'=>'warning','reason'=>'Messaging delivery gateway is available; connection OAuth/onboarding is not exposed through a public capability contract.','details'=>['company_id'=>$context->companyId,'capabilities'=>self::SEND_CAPABILITIES]];}
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Governance;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Governance\GovernanceStateGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Governance\GovernanceStateProviderContract;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ResolvedObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ActionDescriptor;

final readonly class ContainerGovernanceStateGateway implements GovernanceStateGatewayContract
{
    public function __construct(private object $container) {}

    public function inspect(ActionDescriptor $action, ResolvedObjectReference $object, InterfaceContext $context, ?string $receiptId = null, ?string $approvalId = null): GovernanceStateResult
    {
        $providerKey = $action->extensionKey;
        $binding = 'titan.interface.governance.' . $providerKey;
        $provider = null;
        try {
            if (method_exists($this->container,'bound') && $this->container->bound($binding)) $provider = $this->container->make($binding);
            elseif (method_exists($this->container,'bound') && $this->container->bound('titan.interface.governance')) $provider = $this->container->make('titan.interface.governance');
        } catch (\Throwable $e) {
            throw new GovernanceProviderUnavailable('Governance provider could not be resolved.', 0, $e);
        }
        if (! $provider instanceof GovernanceStateProviderContract) {
            throw new GovernanceProviderUnavailable("No governance provider is bound for '{$providerKey}'.");
        }

        $subject = [
            'object_reference'=>$object->reference->canonical(),
            'object_key'=>$object->object->key,
            'action_key'=>$action->key,
            'capability_ref'=>$action->capabilityRef,
            'interaction'=>$action->interaction,
            'receipt_id'=>$receiptId,
            'approval_id'=>$approvalId,
            'trace_id'=>$context->traceId,
            'correlation_id'=>$context->correlationId,
            'causation_id'=>$context->causationId,
        ];
        $result = $provider->inspect($context,$providerKey,$subject);
        if ((string)$result->companyId !== (string)$context->companyId) throw new GovernanceProviderUnavailable('Governance provider returned cross-tenant state.');
        if ((string)$result->userId !== (string)$context->userId) throw new GovernanceProviderUnavailable('Governance provider returned state for another user.');
        return $result;
    }

    public function health(): array
    {
        return [
            'authority'=>'source-governance-engines',
            'binding_convention'=>'titan.interface.governance.{extension-key}',
            'fallback_binding'=>'titan.interface.governance',
            'direct_governance_calculation'=>false,
            'direct_business_persistence'=>false,
        ];
    }
}

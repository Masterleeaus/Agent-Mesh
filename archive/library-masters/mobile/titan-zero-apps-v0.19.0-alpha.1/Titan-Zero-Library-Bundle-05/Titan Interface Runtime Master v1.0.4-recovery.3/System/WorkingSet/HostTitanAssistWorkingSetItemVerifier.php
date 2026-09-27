<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\WorkingSet;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\WorkingSet\WorkingSetDomainItemVerifierContract;

final readonly class HostTitanAssistWorkingSetItemVerifier implements WorkingSetDomainItemVerifierContract
{
    /** @param array<string,array{context:string,id_key:string}> $typeMap */
    public function __construct(private object $container, private array $typeMap) {}

    public function verify(string $itemType, string $itemId, InterfaceContext $context): bool
    {
        $definition=$this->typeMap[$itemType]??null;
        if (! is_array($definition)) return false;
        try {
            if (! method_exists($this->container,'bound') || ! $this->container->bound('titan.assist.context')) return false;
            $resolver=$this->container->make('titan.assist.context');
            if (! is_object($resolver) || ! method_exists($resolver,'resolve')) return false;
            $result=$resolver->resolve([$definition['context']],[$definition['id_key']=>$itemId],[
                'user_id'=>$context->userId,'company_id'=>$context->companyId,'company_id'=>$context->companyId,'workspace_id'=>$context->workspaceId,
            ]);
            return is_array($result) && ! empty($result['resolved'][$definition['context']]??null);
        } catch (\Throwable) { return false; }
    }
}

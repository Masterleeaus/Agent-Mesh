<?php
declare(strict_types=1);
namespace App\Extensions\TitanAppsCore\System\Services;

use App\Extensions\TitanAppsCore\System\Contracts\GovernedDecisionSurface;

final class TitanAppsGovernedDecisionSurface implements GovernedDecisionSurface
{
    public function policy(): array
    {
        return [
            'outcomes'=>['AUTO_EXECUTE','ASK_OWNER','ASK_MANAGER','PREPARE_ONLY','WATCH','BLOCK','ESCALATE'],
            'presentation_authority'=>false,
            'ui_execution_authority'=>false,
            'dispatch_rule'=>'All executable intents return through governed capability or Interaction Engine dispatch.',
            'company_scope_required'=>true,
            'hidden_chain_of_thought_persisted'=>false,
            'interface_runtime_contracts'=>[
                'App\\Extensions\\TitanInterfaceRuntime\\System\\Contracts\\Decision\\DecisionWorkspaceContract',
                'App\\Extensions\\TitanInterfaceRuntime\\System\\Contracts\\Authority\\GovernedActionDispatcherContract',
                'App\\Extensions\\TitanInterfaceRuntime\\System\\Contracts\\Interaction\\InteractionEngineGatewayContract',
            ],
        ];
    }
}

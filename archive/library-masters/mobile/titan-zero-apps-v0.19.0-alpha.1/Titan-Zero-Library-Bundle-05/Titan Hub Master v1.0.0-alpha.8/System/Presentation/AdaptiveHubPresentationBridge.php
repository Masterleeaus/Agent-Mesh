<?php

declare(strict_types=1);
namespace App\Extensions\TitanHub\System\Presentation;

use App\Extensions\TitanHub\System\Contracts\HubPresentationBridge;
use Illuminate\Contracts\Foundation\Application;
use App\Extensions\TitanHub\System\Presentation\HubWorkspaceSpecFactory;

final class AdaptiveHubPresentationBridge implements HubPresentationBridge
{
    public function __construct(private Application $app, private HubWorkspaceSpecFactory $specs) {}
    public function surface(): string { return 'hub'; }

    public function compose(string $workspace,array $context,array $projection): array
    {
        $fallback=['schema'=>'titan.interface.v1','surface'=>'hub','workspace'=>$workspace,'context'=>$this->publicContext($context),'projection'=>$projection,'actions_as_intents'=>true,'fallback'=>true];

        foreach([
            'App\\Extensions\\TitanInterfaceRuntime\\System\\Contracts\\InterfaceRuntime',
            'App\\Extensions\\InterfaceRuntime\\System\\Contracts\\InterfaceRuntime'
        ] as $contract){
            if(!interface_exists($contract)||!$this->app->bound($contract)) continue;
            $runtime=$this->app->make($contract);

            // Canonical Titan Apps Interface Runtime contract.
            if(method_exists($runtime,'execute')){
                $contextClass='App\\Extensions\\TitanInterfaceRuntime\\System\\Value\\InterfaceContext';
                if(class_exists($contextClass)){
                    $runtimeContext=new $contextClass(
                        'hub',
                        $context['journey']??null,
                        $context['company_id']??null,
                        $context['actor_id']??null,
                        [],
                        ['customer_safe'=>true,'company_scoped'=>($context['company_id']??null)!==null],
                        [],
                        ['state'=>$context['connectivity']??'online'],
                        ['workspace'=>$workspace]
                    );
                    $spec=$this->specs->build($workspace,$projection);
                    $result=$runtime->execute($spec,$runtimeContext);
                    if(is_object($result)&&isset($result->tree)){
                        return [
                            'schema'=>'titan.interface.v1',
                            'surface'=>'hub',
                            'workspace'=>$workspace,
                            'tree'=>(array)$result->tree,
                            'repairs'=>(array)($result->repairs??[]),
                            'fallback'=>(bool)($result->fallback??false),
                        ];
                    }
                }
            }

            // Historical public runtime adapters retained for compatibility only.
            if(method_exists($runtime,'compose')) return (array)$runtime->compose($fallback);
            if(method_exists($runtime,'render')) return (array)$runtime->render($fallback);
        }
        return $fallback;
    }

    public function interaction(array $context,array $input): array
    {
        $companyId=trim((string)($context['company_id']??''));
        $actorId=trim((string)($context['actor_id']??''));
        if($companyId===''||$actorId==='') {
            return ['surface'=>'hub','status'=>'unavailable','reason'=>'trusted_company_and_actor_context_required'];
        }

        $nested=is_array($input['input']??null)?$input['input']:[];
        $capability=trim((string)($input['capability']??$nested['capability']??''));
        $payload=is_array($input['payload']??null)?$input['payload']:(is_array($nested['payload']??null)?$nested['payload']:[]);
        $capabilityGateway='App\\Extensions\\InteractionEngine\\System\\Contracts\\CapabilityIntentGatewayInterface';
        if($capability!==''&&interface_exists($capabilityGateway)&&$this->app->bound($capabilityGateway)){
            $trusted=$context+['surface'=>'hub','source_surface'=>'hub','actor_type'=>'customer'];
            return (array)$this->app->make($capabilityGateway)->dispatch($capability,$payload,$trusted);
        }

        $public='App\\Extensions\\InteractionEngine\\System\\Contracts\\PublicInteractionEngineInterface';
        $contextClass='App\\Extensions\\InteractionEngine\\System\\Contracts\\InteractionContext';
        $text=trim((string)($input['text']??$nested['text']??''));
        $intent=trim((string)($input['intent']??$nested['intent']??''));
        if($intent===''&&$text!=='') $intent='hub.customer-assistant.message';
        if($intent!==''&&interface_exists($public)&&class_exists($contextClass)&&$this->app->bound($public)){
            $interactionContext=new $contextClass(
                companyId:$companyId,
                actorId:$actorId,
                surface:'hub',
                journey:isset($context['journey'])?(string)$context['journey']:null,
                deviceId:isset($context['device_id'])?(string)$context['device_id']:null,
                roles:array_values(array_map('strval',(array)($context['roles']??[]))),
                capabilities:array_values(array_map('strval',(array)($context['capabilities']??[]))),
                metadata:['customer_identity'=>$context['customer_identity']??null],
            );
            $facts=is_array($input['facts']??null)?$input['facts']:(is_array($nested['facts']??null)?$nested['facts']:[]);
            if($text!=='') $facts+=['text'=>$text];
            $planned=$this->app->make($public)->presentationIntent($interactionContext,$intent,$facts);
            return ['surface'=>'hub','status'=>'planned','presentation_intent'=>$planned->toArray(),'executed'=>false];
        }

        return ['surface'=>'hub','status'=>'unavailable','reason'=>'interaction_engine_public_contract_not_bound','executed'=>false];
    }

    private function publicContext(array $context): array
    {
        return array_intersect_key($context,array_flip(['surface','portal','locale','connectivity']));
    }
}

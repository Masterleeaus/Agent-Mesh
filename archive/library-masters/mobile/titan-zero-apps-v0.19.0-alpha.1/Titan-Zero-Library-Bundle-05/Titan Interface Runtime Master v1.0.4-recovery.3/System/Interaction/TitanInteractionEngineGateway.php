<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Interaction;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Interaction\InteractionEngineGatewayContract;

final readonly class TitanInteractionEngineGateway implements InteractionEngineGatewayContract
{
    private const SESSION_STORE='App\\Extensions\\InteractionEngine\\System\\Wizard\\Storage\\WizardSessionStoreInterface';
    private const SESSION_ACCESS='App\\Extensions\\InteractionEngine\\System\\Wizard\\Security\\WizardSessionAccessPolicy';
    private const HYBRID_RENDERER='App\\Extensions\\InteractionEngine\\System\\Wizard\\Renderer\\HybridRenderer';
    private const JOURNEY_STORE='App\\Extensions\\InteractionEngine\\System\\Journey\\Runtime\\JourneyRunStoreInterface';

    /** @param array<string,string> $surfaceMap */
    public function __construct(private object $container, private array $surfaceMap=['command'=>'bos','go'=>'field','hub'=>'customer','onboarding'=>'core']) {}

    public function available(): bool
    {
        foreach ([self::SESSION_STORE,self::SESSION_ACCESS,self::HYBRID_RENDERER] as $service) if (! $this->bound($service)) return false;
        return true;
    }

    public function session(InterfaceContext $context, string $sessionId): InteractionSnapshot
    {
        if (preg_match('/^[A-Za-z0-9._:-]{1,160}$/',$sessionId)!==1) throw new InteractionAdapterException('Interaction session identifier is invalid.');
        if (! $this->available()) throw new InteractionAdapterException('Titan Interaction Engine is unavailable.');
        try {
            $store=$this->make(self::SESSION_STORE);$policy=$this->make(self::SESSION_ACCESS);$renderer=$this->make(self::HYBRID_RENDERER);
            if (! method_exists($store,'get') || ! method_exists($policy,'mayAccess') || ! method_exists($renderer,'render')) throw new InteractionAdapterException('Titan Interaction Engine contract is incompatible.');
            $session=$store->get($sessionId);
            if (! is_object($session)) throw new InteractionAdapterException('Interaction session was not found.');
            $actor=$this->actorContext($context);
            if ($policy->mayAccess($session,$actor)!==true) throw new InteractionAdapterException('Interaction session access denied.');
            $rendered=$renderer->render($session);
            if (! is_array($rendered) || ! is_array($rendered['interaction']??null)) throw new InteractionAdapterException('Interaction Engine renderer returned an invalid presentation contract.');
            $viewModel=is_array($rendered['view_model']??null)?$rendered['view_model']:[];
            $interaction=(array)$rendered['interaction'];
            $wizardId=(string)($viewModel['wizard_id']??$interaction['wizard_id']??'');
            $status=(string)($viewModel['status']??($this->property($session,'status')??'in_progress'));
            $stepIndex=(int)($viewModel['step_index']??($this->property($session,'stepIndex')??0));
            $sanitizer=new InteractionPayloadSanitizer();
            $journey=$this->journey($context,$sessionId);
            return new InteractionSnapshot(
                sessionId:(string)($interaction['session_id']??$sessionId),wizardId:$wizardId,status:$status,
                message:(string)($rendered['message']??''),interaction:$this->sanitizeInteraction($interaction),
                structuredStep:$sanitizer->sanitizeStep((array)($viewModel['step']??[])),stepIndex:$stepIndex,
                updatedAt:$this->intProperty($session,'updatedAt'),expiresAt:$this->intProperty($session,'expiresAt'),journey:$journey,
                provenance:[
                    'authority'=>'titan-interaction-engine','access'=>'interaction-engine-session-policy',
                    'company_id'=>$context->companyId,'user_id'=>$context->userId,
                    'product_surface'=>$context->productSurface,'engine_surface'=>$actor['source_surface'],
                    'trace_id'=>$context->traceId,'correlation_id'=>$context->correlationId,
                ],
            );
        } catch (InteractionAdapterException $e) { throw $e; }
        catch (\Throwable $e) { throw new InteractionAdapterException('Interaction Engine adapter failed closed.',0,$e); }
    }

    /** @return array<string,mixed> */
    public function health(): array
    {
        return ['available'=>$this->available(),'source'=>'titan-interaction-engine','mode'=>'soft-container-adapter','journey_store'=>$this->bound(self::JOURNEY_STORE)];
    }

    private function journey(InterfaceContext $context,string $sessionId): ?JourneySnapshot
    {
        if (! $this->bound(self::JOURNEY_STORE)) return null;
        $store=$this->make(self::JOURNEY_STORE);if(!method_exists($store,'findByWizardSession'))return null;
        $run=$store->findByWizardSession((string)$context->companyId,$sessionId);if(!is_object($run)||!method_exists($run,'toArray'))return null;
        $a=$run->toArray();if(!is_array($a))return null;
        $wizardIds=array_values(array_filter(array_map('strval',(array)($a['wizard_ids']??[]))));$index=max(0,(int)($a['wizard_index']??0));
        $checkpoints=[];foreach((array)($a['checkpoints']??[])as$c){if(!is_array($c))continue;$checkpoints[]=['wizard_id'=>(string)($c['wizard_id']??''),'session_id'=>(string)($c['session_id']??''),'saved_at'=>isset($c['saved_at'])?(int)$c['saved_at']:null];if(count($checkpoints)>=100)break;}
        return new JourneySnapshot(
            runId:(string)($a['id']??''),journeyId:(string)($a['journey_id']??''),status:(string)($a['status']??'IN_PROGRESS'),
            currentWizardId:$wizardIds[$index]??null,wizardSessionId:isset($a['wizard_session_id'])?(string)$a['wizard_session_id']:null,
            progress:is_array($a['progress']??null)?(array)$a['progress']:[],checkpoints:$checkpoints,sagaId:isset($a['saga_id'])?(string)$a['saga_id']:null,
        );
    }

    /** @return array<string,mixed> */
    private function actorContext(InterfaceContext $context): array
    {
        return ['company_id'=>(string)$context->companyId,'user_id'=>(string)$context->userId,
            'actor_id'=>(string)$context->userId,'roles'=>$context->roles,'capabilities'=>$context->capabilities,
            'source_surface'=>$this->surfaceMap[$context->productSurface]??$context->productSurface,
            'trace_id'=>$context->traceId,'correlation_id'=>$context->correlationId];
    }

    /** @param array<string,mixed> $interaction @return array<string,mixed> */
    private function sanitizeInteraction(array $interaction): array
    {
        $sanitized=(new InteractionPayloadSanitizer())->sanitizeValue($interaction);
        return is_array($sanitized)?$sanitized:[];
    }

    private function bound(string $service): bool { try{return method_exists($this->container,'bound')&&$this->container->bound($service);}catch(\Throwable){return false;} }
    private function make(string $service): object { $value=$this->container->make($service);if(!is_object($value))throw new InteractionAdapterException('Interaction Engine service resolution failed.');return$value; }
    private function property(object $object,string $name): mixed { try{return property_exists($object,$name)?$object->{$name}:null;}catch(\Throwable){return null;} }
    private function intProperty(object $object,string $name): ?int { $v=$this->property($object,$name);return is_numeric($v)?(int)$v:null; }
}

<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Runtime;

use App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityRouter;
use App\Extensions\InteractionEngine\System\Contracts\CommandBusInterface;
use App\Extensions\InteractionEngine\System\Contracts\InteractionEngineManagerContract;
use App\Extensions\InteractionEngine\System\Contracts\TitanAppsInteractionContract;
use App\Extensions\InteractionEngine\System\Wizard\Command\CommandMapper;
use App\Extensions\InteractionEngine\System\Wizard\Storage\WizardSessionStoreInterface;
use App\Extensions\InteractionEngine\System\LocalIntelligence\LocalBrain;

final class TitanAppsInteractionGateway implements TitanAppsInteractionContract
{
    public function __construct(
        private readonly InteractionEngineManagerContract $manager,
        private readonly CapabilityRouter $router,
        private readonly CommandBusInterface $commands,
        private readonly ?WizardSessionStoreInterface $sessions = null,
        private readonly ?CommandMapper $commandMapper = null,
        private readonly ?LocalBrain $localBrain = null,
    ) {}


    public function interpret(string $message, array $trustedContext = []): array
    {
        $message = trim($message);
        if ($message === '') {
            return [
                'recognized' => false, 'intent' => 'help', 'confidence' => 0.0,
                'entities' => [], 'alternatives' => [], 'classification_source' => 'interaction-engine-empty',
                'mutated' => false, 'authority_inherited' => false, 'execution_authority_granted' => false,
            ];
        }
        if (!$this->manager->isEnabled() || $this->localBrain === null) {
            return [
                'recognized' => false, 'intent' => 'unknown', 'confidence' => 0.0,
                'entities' => [], 'alternatives' => [], 'classification_source' => 'interaction-engine-unavailable',
                'mutated' => false, 'authority_inherited' => false, 'execution_authority_granted' => false,
            ];
        }
        $result = $this->localBrain->process($message, $trustedContext);
        $perception = is_array($result['perception'] ?? null) ? $result['perception'] : [];
        $intent = (string) ($perception['intent'] ?? 'unknown');
        $confidence = (float) ($perception['confidence'] ?? $result['confidence'] ?? 0.0);
        return [
            'recognized' => $intent !== '' && $intent !== 'unknown',
            'intent' => $intent !== '' ? $intent : 'unknown',
            'confidence' => $confidence,
            'entities' => is_array($perception['entities'] ?? null) ? $perception['entities'] : [],
            'alternatives' => is_array($perception['alternatives'] ?? null) ? $perception['alternatives'] : [],
            'classification_source' => 'interaction-engine:'.(string)($perception['classification_source'] ?? LocalBrain::MODEL_VERSION),
            'model_version' => (string)($result['model_version'] ?? LocalBrain::MODEL_VERSION),
            'suggestions' => is_array($result['suggestions'] ?? null) ? $result['suggestions'] : [],
            'escalation' => is_array($result['escalation'] ?? null) ? $result['escalation'] : [],
            'mutated' => false, 'authority_inherited' => false, 'execution_authority_granted' => false,
        ];
    }

    public function prepareJourney(string $capability, ?string $workflowKey, array $trustedContext): array
    {
        if (!$this->manager->isEnabled()) {
            return ['ready'=>false,'available'=>false,'session_validated'=>false,'reason_codes'=>['INTERACTION_ENGINE_DISABLED']];
        }
        $companyId=trim((string)($trustedContext['company_id']??''));
        $actorId=trim((string)($trustedContext['actor_id']??$trustedContext['user_id']??''));
        if($companyId===''||$actorId==='') return ['ready'=>false,'available'=>false,'session_validated'=>false,'reason_codes'=>['TRUSTED_CONTEXT_REQUIRED']];
        $correlation=trim((string)($trustedContext['correlation_id']??''))?:bin2hex(random_bytes(16));
        $sessionId=trim((string)($trustedContext['session_id']??''));
        $execution=new CapabilityExecutionContext(
            companyId:$companyId, actorId:$actorId, actorType:(string)($trustedContext['actor_type']??'human'),
            roles:array_values(array_filter((array)($trustedContext['roles']??[]),'is_string')),
            scopes:array_values(array_filter((array)($trustedContext['scopes']??$trustedContext['delegated_scopes']??[]),'is_string')),
            sourceSurface:(string)($trustedContext['source_surface']??'platform'), correlationId:$correlation,
            interactionId:isset($trustedContext['interaction_id'])?(string)$trustedContext['interaction_id']:null,
            sessionId:$sessionId!==''?$sessionId:null, deviceId:isset($trustedContext['device_id'])?(string)$trustedContext['device_id']:null,
            idempotencyKey:isset($trustedContext['idempotency_key'])?(string)$trustedContext['idempotency_key']:null,
            approvalEvidence:(array)($trustedContext['approval_evidence']??[]),
        );
        $status=$this->router->status($capability,$execution);
        $canonical=(string)($status['canonical_capability']??$this->router->canonical($capability));
        $available=($status['supported']??false)===true&&($status['availability']??null)==='available';
        if(!$available) return ['ready'=>false,'available'=>false,'session_validated'=>false,'canonical_capability'=>$canonical,'workflow_key'=>$workflowKey,'correlation_id'=>$correlation,'reason_codes'=>['INTERACTION_CAPABILITY_UNAVAILABLE'],'status'=>$status];
        if($sessionId==='') return ['ready'=>true,'available'=>true,'session_validated'=>false,'canonical_capability'=>$canonical,'workflow_key'=>$workflowKey,'correlation_id'=>$correlation,'reason_codes'=>['INTERACTION_SESSION_REQUIRED_FOR_EXECUTION'],'status'=>$status];
        if($this->sessions===null||$this->commandMapper===null) return ['ready'=>false,'available'=>true,'session_validated'=>false,'reason_codes'=>['INTERACTION_SESSION_RUNTIME_UNAVAILABLE'],'status'=>$status];
        $session=$this->sessions->get($sessionId);
        if($session===null) return ['ready'=>false,'available'=>true,'session_validated'=>false,'reason_codes'=>['INTERACTION_SESSION_NOT_FOUND'],'status'=>$status];
        $sessionCompany=(string)($session->context['company_id']??''); $sessionActor=(string)($session->context['user_id']??$session->context['actor_id']??'');
        if($sessionCompany!==$companyId||$sessionActor!==$actorId) return ['ready'=>false,'available'=>true,'session_validated'=>false,'reason_codes'=>['INTERACTION_SESSION_CONTEXT_MISMATCH'],'status'=>$status];
        if(!$session->complete()) return ['ready'=>false,'available'=>true,'session_validated'=>false,'reason_codes'=>['INTERACTION_SESSION_INCOMPLETE'],'status'=>$status];
        if($this->router->canonical($session->definition->capability)!==$canonical) return ['ready'=>false,'available'=>true,'session_validated'=>false,'reason_codes'=>['INTERACTION_SESSION_CAPABILITY_MISMATCH'],'status'=>$status];
        $mapped=$this->commandMapper->map($session);
        return ['ready'=>true,'available'=>true,'session_validated'=>true,'mapped_command'=>$mapped,'canonical_capability'=>$canonical,'workflow_key'=>$workflowKey,'correlation_id'=>(string)($mapped['metadata']['correlation_id']??$correlation),'reason_codes'=>[],'status'=>$status];
    }

    public function dispatch(string $capability, array $payload): array
    {
        if(!method_exists($this->commands,'dispatchResult')) {
            $this->commands->dispatch($capability,$payload);
            return ['status'=>'executed','capability'=>$capability];
        }
        $result=$this->commands->dispatchResult($capability,$payload);
        return method_exists($result,'toArray')?$result->toArray():(array)$result;
    }
}

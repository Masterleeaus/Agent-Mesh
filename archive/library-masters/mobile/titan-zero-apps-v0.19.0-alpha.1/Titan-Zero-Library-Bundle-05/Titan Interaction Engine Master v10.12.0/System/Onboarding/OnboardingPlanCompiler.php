<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Onboarding;

final class OnboardingPlanCompiler
{
    /** @var array<string,true> */
    private array $allowedKeys;
    /** @var array<string,array<string,mixed>> */
    private array $fieldMetadata;

    /** @var list<string> */
    private const SENSITIVE_SOURCE_KEYS = [
        'payments.bank_details','payments.gateway_connection','email.connect','sms.connect',
        'ai.credentials','maps.credentials','storage.credentials',
    ];

    /**
     * Orchestration only. Provider/capability ownership comes from question
     * `destinations` metadata in field_home_services_onboarding.json.
     * @var array<string,array{order:int,depends:list<string>,approval:bool,offline:string}>
     */
    private const GROUP_RULES = [
        'company'=>['order'=>10,'depends'=>[],'approval'=>false,'offline'=>'online_required'],
        'business_profile'=>['order'=>15,'depends'=>['company'],'approval'=>false,'offline'=>'online_required'],
        'availability'=>['order'=>20,'depends'=>['company'],'approval'=>false,'offline'=>'online_required'],
        'territory'=>['order'=>30,'depends'=>['company'],'approval'=>false,'offline'=>'online_required'],
        'catalogue'=>['order'=>40,'depends'=>['company'],'approval'=>false,'offline'=>'online_required'],
        'booking'=>['order'=>50,'depends'=>['availability','catalogue'],'approval'=>false,'offline'=>'online_required'],
        'payments'=>['order'=>60,'depends'=>['company'],'approval'=>true,'offline'=>'online_required'],
        'workforce'=>['order'=>70,'depends'=>['company','catalogue'],'approval'=>true,'offline'=>'online_required'],
        'customer_experience'=>['order'=>80,'depends'=>['company'],'approval'=>false,'offline'=>'online_required'],
        'access_security'=>['order'=>90,'depends'=>['company'],'approval'=>true,'offline'=>'online_required'],
        'communications'=>['order'=>100,'depends'=>['company'],'approval'=>true,'offline'=>'online_required'],
        'channels'=>['order'=>110,'depends'=>['company'],'approval'=>true,'offline'=>'online_required'],
        'ai_authority'=>['order'=>120,'depends'=>['company'],'approval'=>true,'offline'=>'online_required'],
        'ai_preferences'=>['order'=>125,'depends'=>['company'],'approval'=>true,'offline'=>'online_required'],
        'integrations'=>['order'=>130,'depends'=>['company'],'approval'=>true,'offline'=>'online_required'],
        'brand'=>['order'=>140,'depends'=>['company'],'approval'=>false,'offline'=>'online_required'],
        'apps'=>['order'=>150,'depends'=>['company','catalogue','brand'],'approval'=>true,'offline'=>'online_required'],
        'chatbot'=>['order'=>160,'depends'=>['company','catalogue'],'approval'=>false,'offline'=>'online_required'],
        'chatbot_knowledge'=>['order'=>165,'depends'=>['chatbot','catalogue'],'approval'=>false,'offline'=>'online_required'],
        'compliance'=>['order'=>170,'depends'=>['company','workforce'],'approval'=>true,'offline'=>'online_required'],
        'activation'=>['order'=>1000,'depends'=>[],'approval'=>true,'offline'=>'online_required'],
    ];

    public function __construct(?array $allowedKeys = null)
    {
        [$allKeys, $metadata] = $this->loadDefinitionMetadata();
        $this->fieldMetadata = $metadata;
        $this->allowedKeys = $allowedKeys !== null
            ? array_intersect_key($allKeys, array_fill_keys(array_map('strval', $allowedKeys), true))
            : $allKeys;
    }

    public function compile(string $companyId, array $answers, ?string $planId = null, array $executionContext = []): OnboardingPlan
    {
        $companyId = trim($companyId);
        if ($companyId === '') throw new \InvalidArgumentException('Onboarding compilation requires trusted company_id.');
        foreach (['company_id','company_id'] as $alias) {
            if (isset($answers[$alias]) && (string) $answers[$alias] !== $companyId) {
                throw new \RuntimeException("Onboarding answer {$alias} does not match trusted company_id.");
            }
        }
        $planId = trim((string) ($planId ?? '')) ?: self::uuid();

        /** @var array<string,array{group:string,provider:string,capability:string,risk:string,approval:bool,order:int,depends:list<string>,offline:string,payload:array}> $buckets */
        $buckets = [];
        foreach ($answers as $key => $value) {
            if (!is_string($key) || !isset($this->allowedKeys[$key])) continue;
            $field = $this->fieldMetadata[$key] ?? null;
            if (!is_array($field)) continue;
            $safeValue = $this->safeAnswerValue($key, $value);
            if ($safeValue === self::DROP) continue;
            foreach ((array) ($field['destinations'] ?? []) as $destination) {
                $provider = trim((string) ($destination['provider'] ?? ''));
                $capability = trim((string) ($destination['capability'] ?? ''));
                $group = trim((string) ($destination['group'] ?? $field['onboarding_group'] ?? ''));
                if ($provider === '' || $capability === '' || $group === '' || $group === 'activation') continue;
                $rule = self::GROUP_RULES[$group] ?? ['order'=>500,'depends'=>[],'approval'=>true,'offline'=>'online_required'];
                $bucketKey = $group . '|' . $provider . '|' . $capability;
                if (!isset($buckets[$bucketKey])) {
                    $buckets[$bucketKey] = [
                        'group'=>$group,'provider'=>$provider,'capability'=>$capability,
                        'risk'=>(string) ($destination['risk'] ?? $field['destination_risk'] ?? 'section'),
                        'approval'=>(bool) $rule['approval'],'order'=>(int) $rule['order'],
                        'depends'=>(array) $rule['depends'],'offline'=>(string) $rule['offline'],'payload'=>[],
                    ];
                }
                $buckets[$bucketKey]['payload'][$key] = $safeValue;
                $buckets[$bucketKey]['risk'] = $this->higherRisk($buckets[$bucketKey]['risk'], (string) ($destination['risk'] ?? $field['destination_risk'] ?? 'section'));
                if (in_array((string) ($field['approval_gate'] ?? ''), ['high','critical'], true) || in_array($buckets[$bucketKey]['risk'], ['high','critical'], true)) {
                    $buckets[$bucketKey]['approval'] = true;
                }
            }
        }

        uasort($buckets, static fn(array $a, array $b): int => [$a['order'],$a['provider'],$a['capability']] <=> [$b['order'],$b['provider'],$b['capability']]);
        $specs = [];$groupIds = [];
        foreach ($buckets as $spec) {
            if ($spec['payload'] === []) continue;
            $id = $this->actionId($planId, $spec['group'], $spec['capability']);
            $spec['id'] = $id;
            $specs[] = $spec;
            $groupIds[$spec['group']][] = $id;
        }

        $actions = [];
        foreach ($specs as $spec) {
            $dependencies = [];
            foreach ($spec['depends'] as $group) foreach ($groupIds[$group] ?? [] as $id) $dependencies[$id] = true;
            $payload = $spec['payload'];
            $payload['_context'] = $this->planContext($executionContext, $companyId, $planId);
            $actions[] = new OnboardingAction(
                $spec['id'],$spec['group'],$spec['capability'],$spec['risk'],$spec['approval'],$payload,$spec['provider'],
                array_keys($dependencies),$spec['order'],[$spec['provider']],$spec['offline'],['scope'=>'company_plan_action'],
            );
        }
        usort($actions, static fn(OnboardingAction $a, OnboardingAction $b): int => [$a->executionOrder,$a->provider,$a->capability] <=> [$b->executionOrder,$b->provider,$b->capability]);

        $activation = [];
        foreach ($answers as $key => $value) {
            if (!is_string($key) || !isset($this->allowedKeys[$key])) continue;
            $field = $this->fieldMetadata[$key] ?? [];
            if (($field['onboarding_group'] ?? null) !== 'activation') continue;
            $safeValue = $this->safeAnswerValue($key, $value);
            if ($safeValue !== self::DROP) $activation[$key] = $safeValue;
        }
        $activation['_context'] = $this->planContext($executionContext, $companyId, $planId);
        $providers = [];
        foreach ($actions as $action) if ($action->provider !== 'interaction') $providers[$action->provider] = true;
        $actions[] = new OnboardingAction(
            $this->actionId($planId,'activation','interaction.onboarding.activate'),'activation','interaction.onboarding.activate','critical',true,$activation,
            'interaction',array_map(static fn(OnboardingAction $a): string => $a->id,$actions),1000,array_keys($providers),'online_required',['scope'=>'company_plan_activation'],
        );
        return new OnboardingPlan($planId,$companyId,$actions,gmdate(DATE_ATOM));
    }

    /** @return list<string> */
    public function actionCapabilities(): array
    {
        $capabilities = ['interaction.onboarding.activate'=>true];
        foreach ($this->fieldMetadata as $field) foreach ((array) ($field['destinations'] ?? []) as $destination) {
            $capability = trim((string) ($destination['capability'] ?? ''));
            if ($capability !== '') $capabilities[$capability] = true;
        }
        $result = array_keys($capabilities);sort($result);return $result;
    }

    private const DROP = "\0DROP\0";

    private function safeAnswerValue(string $key, mixed $value): mixed
    {
        if ($this->isSensitiveKey($key) && !str_ends_with($key,'.connection_status') && !str_ends_with($key,'.connection_reference')) return self::DROP;
        if (str_ends_with($key,'.connection_status') || str_ends_with($key,'.connection_reference')) return $this->safeConnectionValue($value);
        return $this->stripNestedSecrets($value);
    }

    private function isSensitiveKey(string $key): bool
    {
        foreach (self::SENSITIVE_SOURCE_KEYS as $sensitive) if ($key === $sensitive || str_starts_with($key,$sensitive.'.')) return true;
        return false;
    }

    private function safeConnectionValue(mixed $value): mixed
    {
        if (is_string($value) || is_bool($value) || $value === null) return $value;
        if (!is_array($value)) return self::DROP;
        $safe = [];
        foreach (['status','connection_status','connection_reference','state','error_code','checked_at'] as $key) if (array_key_exists($key,$value)) $safe[$key] = $this->stripNestedSecrets($value[$key]);
        return $safe === [] ? self::DROP : $safe;
    }

    private function stripNestedSecrets(mixed $value): mixed
    {
        if (!is_array($value)) return $value;
        $safe = [];
        foreach ($value as $key => $nested) {
            $name = strtolower((string) $key);
            if (preg_match('/(?:password|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|credential)/',$name)) continue;
            $safe[$key] = $this->stripNestedSecrets($nested);
        }
        return $safe;
    }

    /** @return array{0:array<string,true>,1:array<string,array<string,mixed>>} */
    private function loadDefinitionMetadata(): array
    {
        $path = dirname(__DIR__,2).'/resources/wizards/field_home_services_onboarding.json';
        if (!is_file($path)) throw new \RuntimeException('Field/home-services onboarding definition is unavailable.');
        $data = json_decode((string) file_get_contents($path),true,512,JSON_THROW_ON_ERROR);$keys=[];$metadata=[];
        foreach ((array) ($data['wizard']['steps'] ?? []) as $step) foreach ((array) ($step['fields'] ?? []) as $field) {
            $id = trim((string) ($field['id'] ?? ''));if ($id === '') continue;$keys[$id]=true;$metadata[$id]=$field;
        }
        return [$keys,$metadata];
    }

    private function planContext(array $executionContext,string $companyId,string $planId): array
    {
        $safe=[];foreach(['device_id','correlation_id','causation_id','privacy_class','interface','source_surface'] as$key)if(isset($executionContext[$key])&&$executionContext[$key]!=='')$safe[$key]=$executionContext[$key];
        return array_replace($safe,['company_id'=>$companyId,'company_id'=>$companyId,'onboarding_plan_id'=>$planId]);
    }

    private function higherRisk(string $a,string $b): string
    {
        $rank=['section'=>0,'low'=>0,'medium'=>1,'high'=>2,'critical'=>3];return ($rank[$b]??1)>($rank[$a]??1)?$b:$a;
    }
    private function actionId(string $planId,string $group,string $capability): string{return hash('sha256',$planId.'|'.$group.'|'.$capability);}
    private static function uuid(): string{$bytes=random_bytes(16);$bytes[6]=chr((ord($bytes[6])&0x0f)|0x40);$bytes[8]=chr((ord($bytes[8])&0x3f)|0x80);$hex=bin2hex($bytes);return sprintf('%s-%s-%s-%s-%s',substr($hex,0,8),substr($hex,8,4),substr($hex,12,4),substr($hex,16,4),substr($hex,20));}
}

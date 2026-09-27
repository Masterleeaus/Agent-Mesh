<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Onboarding;

final readonly class OnboardingAction
{
    public function __construct(
        public string $id,
        public string $group,
        public string $capability,
        public string $risk,
        public bool $requiresApproval,
        public array $payload,
        public string $provider = 'interaction',
        public array $dependencies = [],
        public int $executionOrder = 0,
        public array $readinessRequirements = [],
        public string $offlineMode = 'online_required',
        public array $idempotencyMetadata = [],
    ) {
        if ($id === '' || $group === '' || $capability === '' || $provider === '') throw new \InvalidArgumentException('Onboarding action id, group, capability and provider are required.');
        if (!in_array($offlineMode,['offline_local','offline_queueable','online_required'],true)) throw new \InvalidArgumentException('Invalid onboarding offline mode.');
    }

    public function toArray(): array
    {
        return [
            'id'=>$this->id,'group'=>$this->group,'provider'=>$this->provider,'capability'=>$this->capability,
            'risk'=>$this->risk,'requires_approval'=>$this->requiresApproval,'payload'=>$this->payload,
            'dependencies'=>$this->dependencies,'execution_order'=>$this->executionOrder,
            'readiness_requirements'=>$this->readinessRequirements,'offline_mode'=>$this->offlineMode,
            'idempotency_metadata'=>$this->idempotencyMetadata,
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            (string)($data['id']??''),(string)($data['group']??''),(string)($data['capability']??''),
            (string)($data['risk']??'section'),(bool)($data['requires_approval']??false),(array)($data['payload']??[]),
            (string)($data['provider']??self::inferProvider((string)($data['capability']??''))),
            array_values(array_map('strval',(array)($data['dependencies']??[]))),(int)($data['execution_order']??0),
            array_values(array_map('strval',(array)($data['readiness_requirements']??[]))),
            (string)($data['offline_mode']??'online_required'),(array)($data['idempotency_metadata']??[]),
        );
    }

    private static function inferProvider(string $capability): string
    {
        return match(true){
            str_starts_with($capability,'crm.')=>'crm',str_starts_with($capability,'builder.')=>'builder',
            str_starts_with($capability,'chatbot.')=>'chatbot',str_starts_with($capability,'communications.')=>'connect',
            str_starts_with($capability,'mobile.')=>'mobile',str_starts_with($capability,'ai.')=>'titan_ai',default=>'interaction'};
    }
}

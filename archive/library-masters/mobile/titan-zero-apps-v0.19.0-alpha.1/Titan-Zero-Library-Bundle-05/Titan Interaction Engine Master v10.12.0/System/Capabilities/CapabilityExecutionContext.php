<?php
declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Capabilities;
final readonly class CapabilityExecutionContext
{
    public function __construct(
        public string $companyId,
        public string $actorId,
        public string $actorType,
        public array $roles,
        public array $scopes,
        public string $sourceSurface,
        public string $correlationId,
        public ?string $interactionId=null,
        public ?string $wizardId=null,
        public ?string $sessionId=null,
        public ?string $deviceId=null,
        public ?string $idempotencyKey=null,
        public array $approvalEvidence=[],
    ) {
        if (trim($companyId)==='') throw new \InvalidArgumentException('Capability execution requires company_id.');
        if (trim($actorId)==='') throw new \InvalidArgumentException('Capability execution requires actor_id.');
    }
    public static function fromPayload(array $payload): self
    {
        $c=(array)($payload['_context']??[]);
        $company=trim((string)($c['company_id']??''));
        if ($company==='' || (isset($c['company_id']) && (string)$c['company_id']!==$company)) throw new \RuntimeException('Trusted company_id context is required.');
        return new self(
            $company,
            trim((string)($c['actor_id']??$c['user_id']??'')),
            (string)($c['actor_type']??'unknown'),
            array_values(array_map('strval',(array)($c['roles']??[]))),
            array_values(array_map('strval',(array)($c['delegated_scopes']??$c['scopes']??[]))),
            self::canonicalSurface((string)($c['source_surface']??$c['interface']??'api')),
            (string)($c['correlation_id']??$payload['correlation_id']??''),
            isset($c['interaction_id'])?(string)$c['interaction_id']:null,
            isset($c['wizard_id'])?(string)$c['wizard_id']:null,
            isset($c['session_id'])?(string)$c['session_id']:null,
            isset($c['device_id'])?(string)$c['device_id']:null,
            isset($c['idempotency_key'])?(string)$c['idempotency_key']:null,
            (array)($payload['_approval']??[]),
        );
    }
    private static function canonicalSurface(string $surface): string
    {
        return match (strtolower(trim($surface))) {
            'bos','command','owner','manager','business','onboarding','setup' => 'zero',
            'field','worker','titan_go','titan-go' => 'go',
            'customer','titan_hub','titan-hub' => 'hub',
            default => strtolower(trim($surface)),
        };
    }
    public function toProviderContext(): array
    {
        return [
            'company_id'=>$this->companyId,'actor_id'=>$this->actorId,'actor_type'=>$this->actorType,
            'roles'=>$this->roles,'scopes'=>$this->scopes,'source_surface'=>$this->sourceSurface,
            'correlation_id'=>$this->correlationId,'interaction_id'=>$this->interactionId,'wizard_id'=>$this->wizardId,
            'session_id'=>$this->sessionId,'device_id'=>$this->deviceId,'idempotency_key'=>$this->idempotencyKey,
        ];
    }
}

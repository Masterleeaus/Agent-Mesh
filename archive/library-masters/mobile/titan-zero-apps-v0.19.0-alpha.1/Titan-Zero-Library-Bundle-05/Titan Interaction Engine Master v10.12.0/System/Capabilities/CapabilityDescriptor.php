<?php
declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Capabilities;
final readonly class CapabilityDescriptor
{
    public function __construct(
        public string $capability,
        public string $provider,
        public string $readOrWrite = 'read',
        public string $risk = 'low',
        public string $authorityLevel = 'recommend_only',
        public bool $approvalRequirement = false,
        public string $offlineMode = 'online_required',
        public bool $idempotent = true,
        public array $requiredRoles = [],
        public array $requiredScopes = [],
        public bool $requiresFreshAuthentication = false,
        public array $inputSchema = [],
        public array $outputSchema = [],
        public bool $availability = false,
        public ?string $reason = null,
        public string $version = '1.0',
        public string $family = 'business_operations',
    ) {
        if (trim($capability)==='' || trim($provider)==='') throw new \InvalidArgumentException('Capability and provider are required.');
        if (!in_array($readOrWrite,['read','write'],true)) throw new \InvalidArgumentException('read_or_write must be read or write.');
        if (!in_array($offlineMode,['offline_local','offline_queueable','online_required'],true)) throw new \InvalidArgumentException('Invalid offline mode.');
    }
    public function withAvailability(bool $available, ?string $reason=null): self
    {
        return new self($this->capability,$this->provider,$this->readOrWrite,$this->risk,$this->authorityLevel,$this->approvalRequirement,$this->offlineMode,$this->idempotent,$this->requiredRoles,$this->requiredScopes,$this->requiresFreshAuthentication,$this->inputSchema,$this->outputSchema,$available,$reason,$this->version,$this->family);
    }
    public function toArray(): array
    {
        return [
            'capability'=>$this->capability,'provider'=>$this->provider,'version'=>$this->version,
            'read_or_write'=>$this->readOrWrite,'risk'=>$this->risk,'authority_level'=>$this->authorityLevel,
            'approval_requirement'=>$this->approvalRequirement,'offline'=>$this->offlineMode,'idempotent'=>$this->idempotent,
            'required_roles'=>$this->requiredRoles,'required_scopes'=>$this->requiredScopes,
            'requires_fresh_authentication'=>$this->requiresFreshAuthentication,'input_schema'=>$this->inputSchema,
            'output_schema'=>$this->outputSchema,'availability'=>$this->availability,'reason'=>$this->reason,'family'=>$this->family,
        ];
    }
}

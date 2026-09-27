<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Interaction;

use App\Extensions\TitanInterfaceRuntime\System\Presentation\CanonicalPresentationValue;

final readonly class InteractionSnapshot implements \JsonSerializable
{
    /**
     * @param array<string,mixed> $interaction
     * @param array<string,mixed> $structuredStep
     * @param array<string,mixed> $provenance
     */
    public function __construct(
        public string $sessionId,
        public string $wizardId,
        public string $status,
        public string $message,
        public array $interaction,
        public array $structuredStep = [],
        public int $stepIndex = 0,
        public ?int $updatedAt = null,
        public ?int $expiresAt = null,
        public ?JourneySnapshot $journey = null,
        public array $provenance = [],
    ) {
        if (trim($sessionId) === '' || trim($wizardId) === '' || trim($status) === '') throw new \InvalidArgumentException('Interaction snapshot identity/status must be explicit.');
        if ($stepIndex < 0) throw new \InvalidArgumentException('Interaction step index cannot be negative.');
    }

    public function resumable(): bool
    {
        return ! in_array(strtolower($this->status), ['completed','cancelled','expired','failed'], true)
            && ($this->expiresAt === null || $this->expiresAt >= time());
    }

    /** @return array<string,mixed> */
    public function safeInteraction(): array
    {
        $payload = $this->interaction;
        $actions=[];
        foreach ((array)($payload['actions'] ?? []) as $action) {
            if (! is_string($action) || preg_match('/^[a-z][a-z0-9._-]{0,63}$/', $action) !== 1) continue;
            $actions[]=['intent'=>$action,'authority'=>'titan-interaction-engine','session_id'=>$this->sessionId,'executable'=>false];
        }
        $payload['actions']=$actions;
        if (isset($payload['ui_presentation_schema']) && is_array($payload['ui_presentation_schema'])) {
            $payload['ui_presentation_schema']['executable_content']=false;
        }
        return CanonicalPresentationValue::normalize($payload);
    }

    /** @return array<string,mixed> */
    public function jsonSerialize(): array
    {
        return CanonicalPresentationValue::normalize([
            'session_id'=>$this->sessionId,'resume_key'=>$this->sessionId,'wizard_id'=>$this->wizardId,
            'status'=>$this->status,'message'=>$this->message,'interaction'=>$this->safeInteraction(),
            'structured_step'=>$this->structuredStep,'step_index'=>$this->stepIndex,
            'updated_at'=>$this->updatedAt,'expires_at'=>$this->expiresAt,'resumable'=>$this->resumable(),
            'journey'=>$this->journey?->jsonSerialize(),'provenance'=>$this->provenance,
        ]);
    }

    public function fingerprint(): string
    {
        return hash('sha256', CanonicalPresentationValue::json($this->jsonSerialize()));
    }
}

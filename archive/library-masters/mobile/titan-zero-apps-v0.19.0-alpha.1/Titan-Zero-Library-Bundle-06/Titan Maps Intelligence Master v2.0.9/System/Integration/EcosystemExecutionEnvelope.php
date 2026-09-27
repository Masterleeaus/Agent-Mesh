<?php
declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\System\Integration;

use InvalidArgumentException;

final class EcosystemExecutionEnvelope
{
    private const AUTHORITY = ['approved','denied','escalate','deferred','read_only'];
    private const STATUSES = ['accepted','executing','succeeded','failed','deferred','duplicate'];

    private function __construct(private array $payload) {}

    public static function fromArray(array $payload): self
    {
        $required = ['envelope_id','company_id','source_extension','target_extension','work_type','correlation_id','causation_id','idempotency_key','provider','authority','status','occurred_at'];
        foreach ($required as $field) {
            if (!array_key_exists($field, $payload) || $payload[$field] === '' || $payload[$field] === null) {
                throw new InvalidArgumentException("Missing ecosystem envelope field: {$field}");
            }
        }
        if (!is_array($payload['provider']) || empty($payload['provider']['extension']) || empty($payload['provider']['capability'])) {
            throw new InvalidArgumentException('Provider provenance requires extension and capability.');
        }
        $decision = is_array($payload['authority']) ? ($payload['authority']['decision'] ?? null) : null;
        if (!in_array($decision, self::AUTHORITY, true)) {
            throw new InvalidArgumentException('Invalid authority decision.');
        }
        if (!in_array($payload['status'], self::STATUSES, true)) {
            throw new InvalidArgumentException('Invalid receipt status.');
        }
        if (isset($payload['evidence_refs']) && !is_array($payload['evidence_refs'])) {
            throw new InvalidArgumentException('evidence_refs must be an array.');
        }
        return new self($payload);
    }

    public function toArray(): array { return $this->payload; }

    public function idempotencyScope(): string
    {
        return implode(':', [(string)$this->payload['company_id'],$this->payload['target_extension'],$this->payload['work_type'],$this->payload['idempotency_key']]);
    }

    public function mayMutate(): bool
    {
        return ($this->payload['authority']['decision'] ?? null) === 'approved'
            && !in_array($this->payload['status'], ['failed','deferred','duplicate'], true);
    }
}

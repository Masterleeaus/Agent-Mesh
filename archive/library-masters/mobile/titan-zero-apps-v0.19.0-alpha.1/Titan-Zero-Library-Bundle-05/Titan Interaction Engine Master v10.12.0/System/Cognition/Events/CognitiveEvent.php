<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Cognition\Events;

use InvalidArgumentException;

final class CognitiveEvent
{
    public function __construct(
        public readonly string $eventId,
        public readonly CognitiveEventType $type,
        public readonly string $companyId,
        public readonly ?string $teamId,
        public readonly ?string $userId,
        public readonly ?string $deviceId,
        public readonly ?string $subjectType,
        public readonly ?string $subjectId,
        public readonly ?string $interactionRunId,
        public readonly ?string $wizardRunId,
        public readonly array $payload,
        public readonly ?float $confidence,
        public readonly array $evidence,
        public readonly ?array $policyDecision,
        public readonly ?string $modelVersion,
        public readonly ?string $parentEventId,
        public readonly string $correlationId,
        public readonly string $privacyClass,
        public readonly int $sequence,
        public readonly string $occurredAt,
        public readonly string $recordedAt,
    ) {
        if ($companyId === '') {
            throw new InvalidArgumentException('Cognitive events require a company ID.');
        }
        if ($confidence !== null && ($confidence < 0.0 || $confidence > 1.0)) {
            throw new InvalidArgumentException('Confidence must be between 0 and 1.');
        }
        if ($sequence < 0) {
            throw new InvalidArgumentException('Sequence cannot be negative.');
        }
    }

    public static function create(
        CognitiveEventType $type,
        string $companyId,
        array $payload = [],
        ?string $userId = null,
        ?string $deviceId = null,
        ?string $teamId = null,
        ?string $subjectType = null,
        ?string $subjectId = null,
        ?string $interactionRunId = null,
        ?string $wizardRunId = null,
        ?float $confidence = null,
        array $evidence = [],
        ?array $policyDecision = null,
        ?string $modelVersion = null,
        ?string $parentEventId = null,
        ?string $correlationId = null,
        string $privacyClass = 'company_private',
        int $sequence = 0,
        ?string $occurredAt = null,
        ?string $eventId = null,
    ): self {
        $now = gmdate(DATE_ATOM);
        return new self(
            eventId: $eventId ?? self::uuid(),
            type: $type,
            companyId: $companyId,
            teamId: $teamId,
            userId: $userId,
            deviceId: $deviceId,
            subjectType: $subjectType,
            subjectId: $subjectId,
            interactionRunId: $interactionRunId,
            wizardRunId: $wizardRunId,
            payload: $payload,
            confidence: $confidence,
            evidence: $evidence,
            policyDecision: $policyDecision,
            modelVersion: $modelVersion,
            parentEventId: $parentEventId,
            correlationId: $correlationId ?? self::uuid(),
            privacyClass: $privacyClass,
            sequence: $sequence,
            occurredAt: $occurredAt ?? $now,
            recordedAt: $now,
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            eventId: (string) $data['event_id'],
            type: CognitiveEventType::from((string) $data['event_type']),
            companyId: (string) $data['company_id'],
            teamId: self::nullableString($data['team_id'] ?? null),
            userId: self::nullableString($data['user_id'] ?? null),
            deviceId: self::nullableString($data['device_id'] ?? null),
            subjectType: self::nullableString($data['subject_type'] ?? null),
            subjectId: self::nullableString($data['subject_id'] ?? null),
            interactionRunId: self::nullableString($data['interaction_run_id'] ?? null),
            wizardRunId: self::nullableString($data['wizard_run_id'] ?? null),
            payload: (array) ($data['payload'] ?? []),
            confidence: isset($data['confidence']) ? (float) $data['confidence'] : null,
            evidence: (array) ($data['evidence'] ?? []),
            policyDecision: isset($data['policy_decision']) ? (array) $data['policy_decision'] : null,
            modelVersion: self::nullableString($data['model_version'] ?? null),
            parentEventId: self::nullableString($data['parent_event_id'] ?? null),
            correlationId: (string) $data['correlation_id'],
            privacyClass: (string) ($data['privacy_class'] ?? 'company_private'),
            sequence: (int) ($data['sequence'] ?? 0),
            occurredAt: (string) $data['occurred_at'],
            recordedAt: (string) $data['recorded_at'],
        );
    }

    public function toArray(): array
    {
        return [
            'event_id' => $this->eventId,
            'event_type' => $this->type->value,
            'company_id' => $this->companyId,
            'team_id' => $this->teamId,
            'user_id' => $this->userId,
            'device_id' => $this->deviceId,
            'subject_type' => $this->subjectType,
            'subject_id' => $this->subjectId,
            'interaction_run_id' => $this->interactionRunId,
            'wizard_run_id' => $this->wizardRunId,
            'payload' => $this->payload,
            'confidence' => $this->confidence,
            'evidence' => $this->evidence,
            'policy_decision' => $this->policyDecision,
            'model_version' => $this->modelVersion,
            'parent_event_id' => $this->parentEventId,
            'correlation_id' => $this->correlationId,
            'privacy_class' => $this->privacyClass,
            'sequence' => $this->sequence,
            'occurred_at' => $this->occurredAt,
            'recorded_at' => $this->recordedAt,
        ];
    }

    private static function uuid(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
        $hex = bin2hex($bytes);
        return sprintf('%s-%s-%s-%s-%s', substr($hex, 0, 8), substr($hex, 8, 4), substr($hex, 12, 4), substr($hex, 16, 4), substr($hex, 20));
    }

    private static function nullableString(mixed $value): ?string
    {
        return $value === null || $value === '' ? null : (string) $value;
    }
}

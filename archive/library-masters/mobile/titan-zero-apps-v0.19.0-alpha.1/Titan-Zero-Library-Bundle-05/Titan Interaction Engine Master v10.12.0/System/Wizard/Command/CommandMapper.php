<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard\Command;

use App\Extensions\InteractionEngine\System\Authority\ApprovalSigner;
use App\Extensions\InteractionEngine\System\Wizard\WizardSession;

final class CommandMapper
{
    public function __construct(private readonly ?ApprovalSigner $approvalSigner = null) {}

    public function map(WizardSession $session): array
    {
        $context = $session->context;
        $companyId = trim((string) ($context['company_id'] ?? ''));
        if ($companyId === '') {
            throw new \RuntimeException('Wizard command mapping requires trusted company_id context.');
        }
        if (isset($context['company_id']) && (string) $context['company_id'] !== $companyId) {
            throw new \RuntimeException('company_id does not match trusted company_id.');
        }

        $correlationId = (string) ($context['correlation_id'] ?? $session->id);
        $causationId = (string) ($context['causation_id'] ?? $correlationId);
        $idempotencyKey = hash('sha256', implode('|', [
            $companyId,
            $session->id,
            $session->definition->capability,
            $session->definition->version,
        ]));

        $payload = $session->data;
        if ($this->hasApproval($payload) && $this->approvalSigner instanceof ApprovalSigner) {
            $actorId = trim((string) ($context['user_id'] ?? ''));
            $roles = array_values(array_map('strval', (array) ($context['roles'] ?? [])));
            if ($actorId !== '') {
                $payload['_approval'] = $this->approvalSigner->issue(
                    $session->definition->capability,
                    $companyId,
                    $actorId,
                    $roles,
                    600,
                    (string) $payload['approval_id'],
                );
            }
        }

        return [
            'id' => self::uuid(),
            'capability' => $session->definition->capability,
            'payload' => $payload,
            'metadata' => [
                'wizard_id' => $session->definition->id,
                'wizard_version' => $session->definition->version,
                'template_id' => (string) ($session->definition->metadata['template_id'] ?? $session->definition->id),
                'template_version' => (string) ($session->definition->metadata['template_version'] ?? $session->definition->version),
                'session_id' => $session->id,
                'company_id' => $companyId,
                'company_id' => $companyId, // compatibility alias only
                'user_id' => $context['user_id'] ?? null,
                'device_id' => (string) ($context['device_id'] ?? ''),
                'correlation_id' => $correlationId,
                'causation_id' => $causationId,
                'idempotency_key' => $idempotencyKey,
                'created_at' => gmdate(DATE_ATOM),
                'created_via' => 'universal_wizard',
            ],
        ];
    }

    private function hasApproval(array $payload): bool
    {
        foreach (['approval_id', 'approved_by', 'approved_at'] as $field) {
            if (!isset($payload[$field]) || $payload[$field] === '') return false;
        }
        return true;
    }

    private static function uuid(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
        $hex = bin2hex($bytes);
        return sprintf('%s-%s-%s-%s-%s', substr($hex, 0, 8), substr($hex, 8, 4), substr($hex, 12, 4), substr($hex, 16, 4), substr($hex, 20));
    }
}

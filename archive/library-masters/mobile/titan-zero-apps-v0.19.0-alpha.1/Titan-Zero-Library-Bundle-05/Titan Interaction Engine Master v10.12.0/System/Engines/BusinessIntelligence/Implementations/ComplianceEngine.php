<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations;

use App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts\ComplianceEngineInterface;

class ComplianceEngine implements ComplianceEngineInterface
{
    private array $violations = [];
    private array $regulations = [
        'privacy' => ['Privacy Act 1988', 'Australian Privacy Principles'],
        'payments' => ['PCI DSS', 'Australian Consumer Law'],
        'employment' => ['Fair Work Act 2009', 'WHS duties'],
        'field_service' => ['WHS duties', 'incident reporting', 'customer consent'],
        'default' => ['data minimisation', 'auditability', 'authorisation'],
    ];

    public function check(string $domain, array $data): array
    {
        $issues = [];
        foreach (($data['required_fields'] ?? []) as $field) {
            if (!array_key_exists($field, $data) || $data[$field] === null || $data[$field] === '') {
                $issues[] = ['type' => 'missing_required_field', 'field' => $field];
            }
        }
        if (($data['contains_personal_data'] ?? false) && empty($data['consent_or_basis'])) {
            $issues[] = ['type' => 'privacy_basis_missing'];
        }
        if (($data['requires_approval'] ?? false) && empty($data['approved_by'])) {
            $issues[] = ['type' => 'approval_missing'];
        }
        foreach ($issues as $issue) {
            $this->violations[] = ['domain' => $domain, 'issue' => $issue, 'recorded_at' => gmdate(DATE_ATOM)];
        }
        return [
            'compliant' => $issues === [],
            'issues' => $issues,
            'regulations' => $this->getRegulations($domain),
            'checked_at' => gmdate(DATE_ATOM),
        ];
    }

    public function getRegulations(string $domain): array
    {
        return $this->regulations[$domain] ?? $this->regulations['default'];
    }

    public function reportViolations(): array
    {
        return $this->violations;
    }
}

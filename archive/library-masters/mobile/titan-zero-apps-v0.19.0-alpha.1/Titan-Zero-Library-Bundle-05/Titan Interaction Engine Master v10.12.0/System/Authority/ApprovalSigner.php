<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Authority;

final class ApprovalSigner
{
    private readonly string $secret;
    private readonly bool $configured;

    public function __construct(string $secret)
    {
        $this->secret = trim($secret);
        $this->configured = strlen($this->secret) >= 16;
    }

    public function isConfigured(): bool
    {
        return $this->configured;
    }

    public function issue(string $capability, string $companyId, string $approvedBy, array $approverRoles, int $ttlSeconds = 600, ?string $subjectId = null): array
    {
        $this->requireConfigured();

        $companyId = trim($companyId);
        if ($companyId === '') {
            throw new \InvalidArgumentException('Approval grants require company_id.');
        }
        $issued = time();
        $grant = [
            'id' => $subjectId ?? bin2hex(random_bytes(16)),
            'capability' => $capability,
            'company_id' => $companyId,
            'company_id' => $companyId, // compatibility alias only
            'approved_by' => $approvedBy,
            'approver_roles' => array_values(array_unique(array_map('strval', $approverRoles))),
            'approved_at' => $issued,
            'expires_at' => $issued + max(1, $ttlSeconds),
            'subject_id' => $subjectId,
            'nonce' => bin2hex(random_bytes(16)),
        ];
        $grant['signature'] = hash_hmac('sha256', $this->canonical($grant), $this->secret);
        return $grant;
    }

    public function verify(array $grant): bool
    {
        if (!$this->configured) return false;
        $signature = (string) ($grant['signature'] ?? '');
        if ($signature === '') return false;
        unset($grant['signature']);
        return hash_equals(hash_hmac('sha256', $this->canonical($grant), $this->secret), $signature);
    }

    private function requireConfigured(): void
    {
        if (!$this->configured) {
            throw new \RuntimeException('Approval signing is unavailable until INTERACTION_APPROVAL_SECRET is configured with at least 16 characters.');
        }
    }

    private function canonical(array $grant): string
    {
        ksort($grant);
        return json_encode($grant, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
    }
}

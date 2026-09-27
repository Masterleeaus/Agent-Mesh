<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Company;

/**
 * Trusted per-request/per-job company context.
 *
 * The Titan platform company boundary is company_id. The source of truth is always a trusted company identity restored by the host boundary.
 */
final class CompanyExecutionContext
{
    private ?string $companyId = null;

    public function __construct(?string $companyId = null)
    {
        if ($companyId !== null && trim($companyId) !== '') {
            $this->companyId = trim($companyId);
        }
    }

    public function restore(string $companyId): void
    {
        $companyId = trim($companyId);
        if ($companyId === '') {
            throw new \InvalidArgumentException('A non-empty company_id is required to restore company context.');
        }

        if ($this->companyId !== null && $this->companyId !== $companyId) {
            throw new \RuntimeException('Tenant execution context cannot be switched between companies inside one scope.');
        }

        $this->companyId = $companyId;
    }

    public function companyId(): string
    {
        if ($this->companyId === null || $this->companyId === '') {
            throw new \RuntimeException('Trusted company company context has not been restored.');
        }

        return $this->companyId;
    }
    public function cacheKey(string $suffix): string
    {
        $suffix = ltrim(trim($suffix), ':');
        if ($suffix === '') {
            throw new \InvalidArgumentException('Company cache suffix cannot be empty.');
        }

        return 'interaction-engine:company:' . $this->companyId() . ':' . $suffix;
    }
}

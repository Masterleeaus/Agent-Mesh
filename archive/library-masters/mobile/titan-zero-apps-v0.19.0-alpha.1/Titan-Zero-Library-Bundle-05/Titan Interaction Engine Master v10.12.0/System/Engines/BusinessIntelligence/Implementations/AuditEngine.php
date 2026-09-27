<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations;

use App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts\AuditEngineInterface;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;

final class AuditEngine implements AuditEngineInterface
{
    public function __construct(private readonly CompanyExecutionContext $tenantContext)
    {
    }

    public function log(array $entry): void
    {
        app('db')->table('interaction_audit_logs')->insert([
            'company_id' => $this->tenantContext->companyId(),
            'entry' => json_encode($entry, JSON_THROW_ON_ERROR),
            'created_at' => now(),
        ]);
    }

    public function query(array $criteria): array
    {
        return app('db')->table('interaction_audit_logs')
            ->where('company_id', $this->tenantContext->companyId())
            ->where('entry', 'LIKE', '%' . ($criteria['keyword'] ?? '') . '%')
            ->limit(5000)->get()
            ->toArray();
    }

    public function getTrail(string $entity): array
    {
        return app('db')->table('interaction_audit_logs')
            ->where('company_id', $this->tenantContext->companyId())
            ->where('entry', 'LIKE', '%' . $entity . '%')
            ->orderBy('created_at')
            ->limit(5000)->get()
            ->toArray();
    }
}

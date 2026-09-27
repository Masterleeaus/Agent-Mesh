<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Executive\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Executive\Contracts\GovernanceEngineInterface;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;

final class GovernanceEngine implements GovernanceEngineInterface
{
    public function __construct(private readonly CompanyExecutionContext $tenantContext)
    {
    }

    public function log(array $event): void
    {
        app('db')->table('interaction_governance_logs')->insert([
            'company_id' => $this->tenantContext->companyId(),
            'event' => json_encode($event, JSON_THROW_ON_ERROR),
            'created_at' => now(),
        ]);
    }

    public function getAuditTrail(string $entity): array
    {
        return app('db')->table('interaction_governance_logs')
            ->where('company_id', $this->tenantContext->companyId())
            ->where('event', 'LIKE', '%' . $entity . '%')
            ->orderBy('created_at')
            ->limit(5000)->get()
            ->toArray();
    }

    public function checkCompliance(string $domain): array
    {
        try {
            $recentIssues = app('db')->table('interaction_governance_logs')
                ->where('company_id', $this->tenantContext->companyId())
                ->where('event', 'LIKE', '%' . $domain . '%')
                ->where('event', 'LIKE', '%"severity":"violation"%')
                ->where('created_at', '>=', now()->subDays(90))
                ->limit(5000)->get();
        } catch (\Throwable) {
            return ['compliant' => null, 'issues' => [], 'note' => 'interaction_governance_logs query failed'];
        }

        $issues = $recentIssues->map(fn ($row) => json_decode($row->event, true))->filter()->values()->all();
        return ['compliant' => empty($issues), 'issues' => $issues];
    }

    public function report(string $type): array
    {
        return ['data' => [], 'type' => $type];
    }
}

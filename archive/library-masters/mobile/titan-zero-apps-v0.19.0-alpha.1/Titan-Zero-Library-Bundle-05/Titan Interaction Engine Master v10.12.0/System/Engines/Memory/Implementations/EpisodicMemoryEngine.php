<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Memory\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Memory\Contracts\EpisodicMemoryEngineInterface;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;

final class EpisodicMemoryEngine implements EpisodicMemoryEngineInterface
{
    public function __construct(private readonly CompanyExecutionContext $tenantContext)
    {
    }

    public function store(array $event): void
    {
        app('db')->table('interaction_episodic_memory')->insert([
            'company_id' => $this->tenantContext->companyId(),
            'event' => json_encode($event, JSON_THROW_ON_ERROR),
            'timestamp' => now(),
        ]);
    }

    public function recall(array $query): array
    {
        return app('db')->table('interaction_episodic_memory')
            ->where('company_id', $this->tenantContext->companyId())
            ->where('timestamp', '>', $query['since'] ?? '1900-01-01')
            ->limit(5000)->get()
            ->toArray();
    }

    public function consolidate(): void
    {
        $rows = app('db')->table('interaction_episodic_memory')
            ->where('company_id', $this->tenantContext->companyId())
            ->orderByDesc('timestamp')
            ->limit(5000)->get();
        $seen = [];
        foreach ($rows as $row) {
            $event = (string) ($row->event ?? '');
            $fingerprint = hash('sha256', $event);
            if (!isset($seen[$fingerprint])) {
                $seen[$fingerprint] = true;
                continue;
            }
            app('db')->table('interaction_episodic_memory')
                ->where('company_id', $this->tenantContext->companyId())
                ->where('id', $row->id)
                ->delete();
        }
    }

    public function forgetOlderThan(int $days): void
    {
        app('db')->table('interaction_episodic_memory')
            ->where('company_id', $this->tenantContext->companyId())
            ->where('timestamp', '<', now()->subDays($days))
            ->delete();
    }
}

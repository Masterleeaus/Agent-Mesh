<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Memory\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Memory\Contracts\SemanticMemoryEngineInterface;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;

final class SemanticMemoryEngine implements SemanticMemoryEngineInterface
{
    public function __construct(private readonly CompanyExecutionContext $tenantContext)
    {
    }

    public function store(array $fact): void
    {
        app('db')->table('interaction_semantic_memory')->insert([
            'company_id' => $this->tenantContext->companyId(),
            'fact' => json_encode($fact, JSON_THROW_ON_ERROR),
            'created_at' => now(),
        ]);
    }

    public function query(array $query): array
    {
        return app('db')->table('interaction_semantic_memory')
            ->where('company_id', $this->tenantContext->companyId())
            ->where('fact', 'LIKE', '%' . ($query['keyword'] ?? '') . '%')
            ->limit(5000)->get()
            ->toArray();
    }

    public function consolidate(): void
    {
        $rows = app('db')->table('interaction_semantic_memory')
            ->where('company_id', $this->tenantContext->companyId())
            ->orderByDesc('created_at')
            ->limit(5000)->get();
        $seen = [];
        foreach ($rows as $row) {
            $fact = (string) ($row->fact ?? '');
            $fingerprint = hash('sha256', $fact);
            if (!isset($seen[$fingerprint])) {
                $seen[$fingerprint] = true;
                continue;
            }
            app('db')->table('interaction_semantic_memory')
                ->where('company_id', $this->tenantContext->companyId())
                ->where('id', $row->id)
                ->delete();
        }
    }

    public function getFacts(): array
    {
        return app('db')->table('interaction_semantic_memory')
            ->where('company_id', $this->tenantContext->companyId())
            ->limit(5000)->get()
            ->toArray();
    }
}

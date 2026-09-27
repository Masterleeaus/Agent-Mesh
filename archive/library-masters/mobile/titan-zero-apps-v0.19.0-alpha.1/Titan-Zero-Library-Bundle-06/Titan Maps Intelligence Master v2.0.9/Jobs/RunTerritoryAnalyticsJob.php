<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Jobs;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Services\FixedAuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Services\TerritoryAnalyticsManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Container\Container;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class RunTerritoryAnalyticsJob implements ShouldQueue
{
    public bool $afterCommit = true;

    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 120;

    public function __construct(
        public readonly string $companyId,
        public readonly string $userId,
        public readonly ?string $branchId,
        public readonly ?string $workspaceId,
        public readonly string $analysisType,
        public readonly string $searchId,
        public readonly array $searchArea = [],
        public readonly array $execution = [],
    ) {}

    public function handle(Container $app): void
    {
        $app->instance(AuthorisedCompanyContext::class, new FixedAuthorisedCompanyContext(
            $this->companyId,
            $this->userId,
            $this->branchId,
            $this->workspaceId,
        ));

        try {
            /** @var TerritoryAnalyticsManager $analytics */
            $analytics = $app->make(TerritoryAnalyticsManager::class);
            $analytics->runTrusted($this->analysisType, $this->searchId, $this->searchArea, $this->execution);
        } finally {
            $app->forgetInstance(AuthorisedCompanyContext::class);
        }
    }
}

<?php

declare(strict_types=1);

namespace Tests\Feature\Extensions\TitanMapsIntelligence;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\WorkerIdentityResolver;
use App\Extensions\TitanMapsIntelligence\DTO\WorkerIdentity;
use App\Extensions\TitanMapsIntelligence\DTO\WorkerLocationPing;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Models\MapWorkerTrackingState;
use App\Extensions\TitanMapsIntelligence\Services\WorkerTrackingService;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class WorkerTrackingSecurityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->app->bind(AuthorisedCompanyContext::class, static fn () => new class implements AuthorisedCompanyContext {
            public function companyId(): string { return 'company-a'; }
            public function userId(): string { return 'user-a'; }
            public function branchId(): ?string { return null; }
            public function workspaceId(): ?string { return null; }
        });
        $this->app->bind(WorkerIdentityResolver::class, static fn () => new class implements WorkerIdentityResolver {
            public function resolve(string $companyId, string $userId, ?string $requestedWorkerPublicId = null): WorkerIdentity
            {
                if ($requestedWorkerPublicId === 'worker-b') {
                    throw MapsIntelligenceException::fromCode('MAPS_WORKER_REFERENCE_DENIED', 'Foreign worker');
                }
                return new WorkerIdentity($companyId, $userId, 'worker-a');
            }
        });
    }

    public function test_off_duty_worker_cannot_publish(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') self::markTestSkipped('Uses host MySQL integration database.');
        DB::beginTransaction();
        try {
            MapWorkerTrackingState::query()->create([
                'company_id'=>'company-a','worker_public_id'=>'worker-a','user_id'=>'user-a','tracking_allowed'=>true,'on_duty'=>false,
            ]);
            $this->expectException(MapsIntelligenceException::class);
            $this->app->make(WorkerTrackingService::class)->ingest(new WorkerLocationPing(-37.81,144.96,10.0,new DateTimeImmutable('now')));
        } finally { DB::rollBack(); }
    }


    public function test_stale_sample_is_rejected(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') self::markTestSkipped('Uses host MySQL integration database.');
        DB::beginTransaction();
        try {
            MapWorkerTrackingState::query()->create([
                'company_id'=>'company-a','worker_public_id'=>'worker-a','user_id'=>'user-a','tracking_allowed'=>true,'on_duty'=>true,
            ]);
            $this->expectException(MapsIntelligenceException::class);
            $this->app->make(WorkerTrackingService::class)->ingest(new WorkerLocationPing(-37.81,144.96,10.0,new DateTimeImmutable('-2 hours')));
        } finally { DB::rollBack(); }
    }

    public function test_cross_worker_reference_is_rejected(): void
    {
        $this->expectException(MapsIntelligenceException::class);
        $this->app->make(WorkerTrackingService::class)->current('worker-b');
    }
}

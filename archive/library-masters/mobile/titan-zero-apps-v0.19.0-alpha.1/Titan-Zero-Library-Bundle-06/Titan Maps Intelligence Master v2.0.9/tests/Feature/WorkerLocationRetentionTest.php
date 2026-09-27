<?php

declare(strict_types=1);

namespace Tests\Feature\Extensions\TitanMapsIntelligence;

use App\Extensions\TitanMapsIntelligence\Models\MapLocationPing;
use App\Extensions\TitanMapsIntelligence\Services\WorkerLocationRetentionService;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class WorkerLocationRetentionTest extends TestCase
{
    public function test_pruning_removes_old_history_and_keeps_recent_history(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') self::markTestSkipped('Uses host MySQL integration database.');
        DB::beginTransaction();
        try {
            foreach ([['old', '-40 days'], ['new', '-1 day']] as [$key, $when]) {
                MapLocationPing::query()->create([
                    'company_id'=>'company-a','worker_public_id'=>'worker-a','user_id'=>'user-a',
                    'latitude'=>-37.81,'longitude'=>144.96,'accuracy_metres'=>10,
                    'captured_at'=>new DateTimeImmutable($when),'received_at'=>new DateTimeImmutable($when),
                    'dedupe_key'=>hash('sha256', $key),
                ]);
            }
            self::assertSame(1, $this->app->make(WorkerLocationRetentionService::class)->prune(30));
            self::assertSame(1, MapLocationPing::query()->forCompany('company-a')->count());
        } finally { DB::rollBack(); }
    }
}

<?php

declare(strict_types=1);
namespace Tests\Unit;
use App\Extensions\TitanMapsIntelligence\Services\DispatchScoreService;
use PHPUnit\Framework\TestCase;
final class DispatchScoreServiceTest extends TestCase
{
    public function test_explicit_mandatory_certification_failure_blocks_closer_worker(): void
    {
        $service=new DispatchScoreService(); $job=['priority'=>'urgent'];
        $blocked=$service->score($job,['eta_seconds'=>300,'skill_match'=>1,'availability_status'=>'available','mandatory_certification_status'=>'failed']);
        $eligible=$service->score($job,['eta_seconds'=>1200,'skill_match'=>1,'availability_status'=>'available','mandatory_certification_status'=>'verified']);
        self::assertTrue($blocked->blocked); self::assertContains('mandatory_qualification_failed',$blocked->blockers); self::assertFalse($eligible->blocked);
    }
    public function test_unknown_certification_is_preserved_as_unknown_not_verified(): void
    {
        $score=(new DispatchScoreService())->score(['priority'=>'normal'],['eta_seconds'=>900,'availability_status'=>'available','mandatory_certification_status'=>'unknown']);
        self::assertFalse($score->blocked); self::assertSame('unknown',$score->evidence['certification']['status']);
    }
}

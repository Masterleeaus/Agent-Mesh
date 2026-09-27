<?php

declare(strict_types=1);
namespace Tests\Feature;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Offline\OfflineSyncWorkspaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Performance\PresentationQualityGate;
use Tests\TestCase;
final class OfflineSyncQualityBindingTest extends TestCase
{
    public function test_pass19_services_are_bound():void
    {
        self::assertInstanceOf(OfflineSyncWorkspaceContract::class,app(OfflineSyncWorkspaceContract::class));
        self::assertInstanceOf(PresentationQualityGate::class,app(PresentationQualityGate::class));
    }
}

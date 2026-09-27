<?php

declare(strict_types=1);

namespace Tests\Feature\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\TitanInterfaceRuntimeManagerContract;
use Tests\TestCase;

final class DisableStateTest extends TestCase
{
    public function test_disabled_configuration_reports_disabled_without_increasing_authority(): void
    {
        config()->set('titan-interface-runtime.enabled', false);

        $runtime = $this->app->make(TitanInterfaceRuntimeManagerContract::class);
        self::assertSame('DISABLED', $runtime->health()['status']);
        self::assertFalse($runtime->boundaries()['direct_business_writes']);
    }
}

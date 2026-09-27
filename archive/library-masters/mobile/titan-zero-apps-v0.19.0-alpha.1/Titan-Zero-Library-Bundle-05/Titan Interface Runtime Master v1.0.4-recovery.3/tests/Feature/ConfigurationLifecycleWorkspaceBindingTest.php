<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Configuration\ConfigurationLifecycleWorkspaceContract;
use Tests\TestCase;

final class ConfigurationLifecycleWorkspaceBindingTest extends TestCase
{
    public function test_pass17_configuration_lifecycle_workspace_is_bound(): void
    {
        self::assertInstanceOf(ConfigurationLifecycleWorkspaceContract::class,app(ConfigurationLifecycleWorkspaceContract::class));
    }
}

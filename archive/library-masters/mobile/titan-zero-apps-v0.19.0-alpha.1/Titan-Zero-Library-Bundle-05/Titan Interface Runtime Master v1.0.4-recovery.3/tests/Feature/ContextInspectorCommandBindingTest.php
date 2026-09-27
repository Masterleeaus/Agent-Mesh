<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Command\CommandSurfaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Inspector\ContextInspectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ActionRegistryContract;
use Tests\TestCase;

final class ContextInspectorCommandBindingTest extends TestCase
{
    public function test_pass11_services_are_bound(): void
    {
        self::assertInstanceOf(ActionRegistryContract::class, app(ActionRegistryContract::class));
        self::assertInstanceOf(ContextInspectorContract::class, app(ContextInspectorContract::class));
        self::assertInstanceOf(CommandSurfaceContract::class, app(CommandSurfaceContract::class));
    }
}

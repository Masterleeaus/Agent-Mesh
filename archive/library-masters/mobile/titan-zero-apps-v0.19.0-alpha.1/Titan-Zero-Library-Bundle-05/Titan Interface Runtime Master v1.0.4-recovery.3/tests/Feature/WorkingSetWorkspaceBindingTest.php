<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\WorkingSet\WorkingSetGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\WorkingSet\WorkingSetDomainItemVerifierContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\WorkingSet\WorkingSetWorkspaceContract;
use Tests\TestCase;

final class WorkingSetWorkspaceBindingTest extends TestCase
{
    public function test_pass16_working_set_workspace_is_bound(): void
    {
        self::assertInstanceOf(WorkingSetGatewayContract::class,app(WorkingSetGatewayContract::class));
        self::assertInstanceOf(WorkingSetDomainItemVerifierContract::class,app(WorkingSetDomainItemVerifierContract::class));
        self::assertInstanceOf(WorkingSetWorkspaceContract::class,app(WorkingSetWorkspaceContract::class));
    }
}

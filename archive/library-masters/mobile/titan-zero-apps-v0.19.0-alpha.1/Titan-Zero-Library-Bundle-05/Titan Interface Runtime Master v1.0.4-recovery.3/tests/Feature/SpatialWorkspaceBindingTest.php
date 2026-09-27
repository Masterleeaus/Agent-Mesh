<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Spatial\SpatialWorkspaceContract;
use Tests\TestCase;

final class SpatialWorkspaceBindingTest extends TestCase
{
    public function test_pass13_spatial_workspace_is_bound(): void
    {
        self::assertInstanceOf(SpatialWorkspaceContract::class, app(SpatialWorkspaceContract::class));
    }
}

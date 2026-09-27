<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\FacetRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Workspace\ObjectWorkspaceComposerContract;
use Tests\TestCase;

final class FacetWorkspaceBindingTest extends TestCase
{
    public function test_facet_registry_and_workspace_composer_are_bound(): void
    {
        self::assertInstanceOf(FacetRegistryContract::class, app(FacetRegistryContract::class));
        self::assertInstanceOf(ObjectWorkspaceComposerContract::class, app(ObjectWorkspaceComposerContract::class));
    }
}

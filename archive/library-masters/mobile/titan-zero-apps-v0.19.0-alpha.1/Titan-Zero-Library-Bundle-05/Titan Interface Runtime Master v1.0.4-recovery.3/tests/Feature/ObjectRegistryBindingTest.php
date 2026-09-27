<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryObjectRegistry;
use Tests\TestCase;

final class ObjectRegistryBindingTest extends TestCase
{
    public function test_object_registry_is_bound_as_runtime_service(): void
    {
        self::assertInstanceOf(InMemoryObjectRegistry::class, app(ObjectRegistryContract::class));
    }
}

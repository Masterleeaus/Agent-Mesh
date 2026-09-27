<?php

declare(strict_types=1);

namespace Tests\Feature\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Interaction\InteractionEngineGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Interaction\InteractionPresentationAdapter;
use Tests\TestCase;

final class InteractionEngineBindingTest extends TestCase
{
    public function test_interaction_adapter_contracts_are_bound(): void
    {
        self::assertTrue(app()->bound(InteractionEngineGatewayContract::class));
        self::assertInstanceOf(InteractionPresentationAdapter::class, app(InteractionPresentationAdapter::class));
    }
}

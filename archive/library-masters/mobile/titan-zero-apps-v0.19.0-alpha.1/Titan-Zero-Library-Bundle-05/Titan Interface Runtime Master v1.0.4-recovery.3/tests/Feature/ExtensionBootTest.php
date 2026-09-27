<?php

declare(strict_types=1);

namespace Tests\Feature\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextResolverContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextStoreContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Discovery\InterfaceContributionDiscoveryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\InterfaceContributionRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\DomainRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Navigation\NavigationProjectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\TitanInterfaceRuntimeManagerContract;
use App\Extensions\TitanInterfaceRuntime\System\TitanInterfaceRuntimeServiceProvider;
use Tests\TestCase;

final class ExtensionBootTest extends TestCase
{
    public function test_provider_is_loaded_and_key_is_stable(): void
    {
        self::assertTrue($this->app->providerIsLoaded(TitanInterfaceRuntimeServiceProvider::class));
        self::assertSame(
            'titan-interface-runtime',
            $this->app->getProvider(TitanInterfaceRuntimeServiceProvider::class)?->registerKey(),
        );
    }

    public function test_core_pass_one_contracts_are_bound(): void
    {
        self::assertTrue($this->app->bound(TitanInterfaceRuntimeManagerContract::class));
        self::assertTrue($this->app->bound(InterfaceContributionRegistryContract::class));
        self::assertTrue($this->app->bound(InterfaceContributionDiscoveryContract::class));
        self::assertTrue($this->app->bound(InterfaceContextResolverContract::class));
        self::assertTrue($this->app->bound(InterfaceContextStoreContract::class));
        self::assertTrue($this->app->bound(DomainRegistryContract::class));
        self::assertTrue($this->app->bound(NavigationProjectorContract::class));

        $health = $this->app->make(TitanInterfaceRuntimeManagerContract::class)->health();
        self::assertSame('titan-ui', $health['runtime_profile']);
        self::assertFalse($health['business_data_authority']);
        self::assertFalse($health['direct_business_writes']);
    }
}

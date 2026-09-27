<?php

declare(strict_types=1);

namespace Tests\Feature\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorizedViewReader;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\ReadAuthorityRouterContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Data\DataModeProjectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\LegacyDataSurfaceRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ViewRegistryContract;
use Tests\TestCase;

final class ReadAuthorityBindingTest extends TestCase
{
    public function test_pass8_services_are_bound(): void
    {
        self::assertNotNull(app(ViewRegistryContract::class));
        self::assertNotNull(app(LegacyDataSurfaceRegistryContract::class));
        self::assertNotNull(app(ReadAuthorityRouterContract::class));
        self::assertNotNull(app(AuthorizedViewReader::class));
        self::assertNotNull(app(DataModeProjectorContract::class));
    }
}

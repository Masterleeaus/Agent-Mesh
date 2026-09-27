<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Support;

final readonly class AppPresentationContext
{
    public function __construct(
        public AppContext $app,
        public AppDeviceContext $device = new AppDeviceContext(),
        public AppConnectivityContext $connectivity = new AppConnectivityContext(true),
    ) {}
}

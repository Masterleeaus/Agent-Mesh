<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Discovery;

use App\Extensions\TitanInterfaceRuntime\System\Discovery\InterfaceContributionDiscoverySnapshot;

interface InterfaceContributionDiscoveryContract
{
    public function discover(bool $force = false): InterfaceContributionDiscoverySnapshot;

    public function snapshot(): InterfaceContributionDiscoverySnapshot;
}

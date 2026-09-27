<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Health;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\{InterfaceContributionRegistry,InterfaceRuntime};
final class InterfaceRuntimeHealthCheck
{
    public function __construct(private InterfaceContributionRegistry $registry,private InterfaceRuntime $runtime){}
    public function report(): array { return ['status'=>'ok','surface_contract'=>'zero/go/hub','contributions'=>count($this->registry->all()),'runtime'=>get_class($this->runtime),'authority'=>'presentation-only']; }
}

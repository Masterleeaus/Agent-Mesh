<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Value;

final readonly class SurfaceResolution
{
    public function __construct(public string $surface, public ?string $journey = null, public ?string $legacy = null) {}
}

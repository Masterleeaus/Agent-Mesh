<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Value;

final readonly class InterfaceContext
{
    public function __construct(
        public string $surface,
        public ?string $journey,
        public string|int|null $companyId,
        public string|int|null $actorId,
        public array $permissions = [],
        public array $projection = [],
        public array $device = [],
        public array $connectivity = [],
        public array $presentation = [],
    ) {}
}

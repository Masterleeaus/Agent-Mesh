<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Support;

final readonly class AppSession
{
    public function __construct(
        public string $sessionId,
        public int $companyId,
        public int $actorId,
        public bool $offline = false,
    ) {}
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Support;

final readonly class AppCapabilityContext
{
    /** @param list<string> $capabilityIds */
    public function __construct(public array $capabilityIds = []) {}
    public function has(string $id): bool { return in_array($id, $this->capabilityIds, true); }
}

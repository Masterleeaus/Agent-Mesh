<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Contracts;

interface TitanAppsIntelligenceRoutingContract
{
    /** @param array<string,mixed> $request @param array<string,bool> $available @return array<string,mixed> */
    public function select(array $request, array $available): array;
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

use Closure;

interface QueueTenantContext
{
    public function run(string $companyId, Closure $callback): mixed;

    public function companyId(): string;
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Contracts;

interface DataSourceProvider
{
    /** @return list<array<string,mixed>> */
    public function definitions(?int $companyId = null): array;
}

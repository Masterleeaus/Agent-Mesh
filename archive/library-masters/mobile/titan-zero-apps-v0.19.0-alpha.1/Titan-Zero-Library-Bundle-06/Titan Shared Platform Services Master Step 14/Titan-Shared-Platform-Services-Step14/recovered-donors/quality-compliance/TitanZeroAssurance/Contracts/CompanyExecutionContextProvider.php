<?php

declare(strict_types=1);

namespace Modules\TitanZeroAssurance\Contracts;

use Modules\TitanZeroAssurance\ValueObjects\CompanyExecutionContext;

interface CompanyExecutionContextProvider
{
    public function current(): ?CompanyExecutionContext;

    public function require(): CompanyExecutionContext;
}

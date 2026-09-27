<?php

declare(strict_types=1);

namespace Modules\TitanZeroAssurance\Services;

use LogicException;
use Modules\TitanZeroAssurance\Contracts\CompanyExecutionContextProvider;
use Modules\TitanZeroAssurance\ValueObjects\CompanyExecutionContext;

final class ExecutionContextStore implements CompanyExecutionContextProvider
{
    private ?CompanyExecutionContext $context = null;

    public function current(): ?CompanyExecutionContext
    {
        return $this->context;
    }

    public function require(): CompanyExecutionContext
    {
        return $this->context ?? throw new LogicException('A company execution context is required.');
    }

    public function set(CompanyExecutionContext $context): void
    {
        $this->context = $context;
    }

    public function clear(): void
    {
        $this->context = null;
    }

    public function runWith(CompanyExecutionContext $context, callable $callback): mixed
    {
        $previous = $this->context;
        $this->context = $context;

        try {
            return $callback();
        } finally {
            $this->context = $previous;
        }
    }
}

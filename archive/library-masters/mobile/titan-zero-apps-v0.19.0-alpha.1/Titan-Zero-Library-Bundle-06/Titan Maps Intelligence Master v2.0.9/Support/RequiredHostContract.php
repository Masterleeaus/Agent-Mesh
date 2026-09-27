<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Support;

use App\Extensions\TitanMapsIntelligence\Exceptions\MissingHostContractException;
use Closure;

final class RequiredHostContract
{
    private Closure $resolver;

    public function __construct(callable $resolver)
    {
        $this->resolver = Closure::fromCallable($resolver);
    }

    public function assertBound(string $contract, callable $bound): void
    {
        if (! $bound($contract)) {
            throw MissingHostContractException::fromCode(
                'MAPS_HOST_CONTRACT_MISSING',
                'A required host integration contract is not bound.',
                ['contract' => $contract],
            );
        }
    }

    public function resolve(string $contract): object
    {
        $resolved = ($this->resolver)($contract);
        if (! is_object($resolved) || ! $resolved instanceof $contract) {
            throw MissingHostContractException::fromCode(
                'MAPS_HOST_CONTRACT_MISSING',
                'A required host integration contract is not bound.',
                ['contract' => $contract],
            );
        }

        return $resolved;
    }
}

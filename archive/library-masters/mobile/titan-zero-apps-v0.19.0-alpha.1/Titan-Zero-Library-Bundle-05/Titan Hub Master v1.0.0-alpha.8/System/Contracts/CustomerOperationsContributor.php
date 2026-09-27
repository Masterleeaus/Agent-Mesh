<?php

declare(strict_types=1);
namespace App\Extensions\TitanHub\System\Contracts;

/** Provider-facing read/action contribution. Implementations remain domain authority. */
interface CustomerOperationsContributor
{
    /** @return list<string> */
    public function supports(): array;
    public function read(string $operation, array $context, array $arguments=[]): mixed;
    public function act(string $operation, array $context, array $payload=[]): mixed;
}

<?php
declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Contracts;

interface GovernedOperationActivityGatewayInterface
{
    /** @param array<string,mixed> $trustedContext @return list<array<string,mixed>> */
    public function list(array $trustedContext,int $limit=100): array;
    /** @param array<string,mixed> $trustedContext @return array<string,mixed>|null */
    public function find(string $operationId,array $trustedContext): ?array;
    /** @param array<string,mixed> $observation @param array<string,mixed> $trustedContext @return array<string,mixed> */
    public function observe(string $operationId,array $observation,array $trustedContext): array;
}

<?php
declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Contracts;

interface GovernedOperationLedgerInterface
{
    /** @param array<string,mixed> $operation */
    public function record(string $companyId,string $operationId,array $operation): void;
    /** @return array<string,mixed>|null */
    public function find(string $companyId,string $operationId): ?array;
    /** @return list<array<string,mixed>> */
    public function list(string $companyId,?string $actorId=null,int $limit=100): array;
}

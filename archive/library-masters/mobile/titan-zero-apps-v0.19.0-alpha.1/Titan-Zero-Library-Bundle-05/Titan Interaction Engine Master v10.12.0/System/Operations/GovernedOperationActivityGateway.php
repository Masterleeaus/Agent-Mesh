<?php
declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Operations;

use App\Extensions\InteractionEngine\System\Contracts\{GovernedOperationActivityGatewayInterface,GovernedOperationLedgerInterface};

final class GovernedOperationActivityGateway implements GovernedOperationActivityGatewayInterface
{
    public function __construct(private readonly GovernedOperationLedgerInterface $ledger) {}

    public function list(array $trustedContext,int $limit=100): array
    {
        [$companyId,$actorId,$companyWide]=$this->context($trustedContext);
        return $this->ledger->list($companyId,$companyWide?null:$actorId,$limit);
    }

    public function find(string $operationId,array $trustedContext): ?array
    {
        [$companyId,$actorId,$companyWide]=$this->context($trustedContext);
        $row=$this->ledger->find($companyId,$operationId);
        if($row===null)return null;
        if(!$companyWide&&(string)($row['actor_id']??'')!==$actorId)throw new \RuntimeException('governed_operation_actor_scope_violation');
        return $row;
    }

    public function observe(string $operationId,array $observation,array $trustedContext): array
    {
        [$companyId,$actorId,$companyWide]=$this->context($trustedContext);
        $existing=$this->ledger->find($companyId,$operationId);
        if($existing===null)throw new \RuntimeException('governed_operation_not_found');
        if(!$companyWide&&(string)($existing['actor_id']??'')!==$actorId)throw new \RuntimeException('governed_operation_actor_scope_violation');
        foreach(['company_id','actor_id','operation_id','capability','source_surface'] as $protected) unset($observation[$protected]);
        $this->ledger->record($companyId,$operationId,['observation'=>$observation]+$observation);
        return $this->ledger->find($companyId,$operationId)??$existing;
    }

    /** @return array{string,string,bool} */
    private function context(array $trusted): array
    {
        $companyId=trim((string)($trusted['company_id']??'')); $actorId=trim((string)($trusted['actor_id']??''));
        if($companyId===''||$actorId==='')throw new \InvalidArgumentException('Trusted company_id and actor_id are required.');
        return [$companyId,$actorId,($trusted['operation_scope']??'actor')==='company'];
    }
}

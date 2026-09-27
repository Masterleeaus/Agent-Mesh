<?php
declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Operations;

use App\Extensions\InteractionEngine\System\Contracts\GovernedOperationLedgerInterface;

final class InMemoryGovernedOperationLedger implements GovernedOperationLedgerInterface
{
    /** @var array<string,array<string,array<string,mixed>>> */
    private array $rows=[];

    public function record(string $companyId,string $operationId,array $operation): void
    {
        $companyId=$this->id($companyId,'company_id');
        $operationId=$this->id($operationId,'operation_id');
        $existing=$this->rows[$companyId][$operationId]??[];
        $this->rows[$companyId][$operationId]=array_replace_recursive($existing,$operation,[
            'company_id'=>$companyId,
            'operation_id'=>$operationId,
            'updated_at'=>$operation['updated_at']??gmdate(DATE_ATOM),
        ]);
    }

    public function find(string $companyId,string $operationId): ?array
    {
        return $this->rows[$this->id($companyId,'company_id')][$this->id($operationId,'operation_id')]??null;
    }

    public function list(string $companyId,?string $actorId=null,int $limit=100): array
    {
        $rows=array_values($this->rows[$this->id($companyId,'company_id')]??[]);
        if($actorId!==null&&trim($actorId)!=='') $rows=array_values(array_filter($rows,static fn(array $r):bool=>(string)($r['actor_id']??'')===(string)$actorId));
        usort($rows,static fn(array $a,array $b):int=>strcmp((string)($b['updated_at']??''),(string)($a['updated_at']??'')));
        return array_slice($rows,0,max(1,min(500,$limit)));
    }

    private function id(string $value,string $field): string
    {
        $value=trim($value);
        if($value==='') throw new \InvalidArgumentException($field.' is required.');
        return $value;
    }
}

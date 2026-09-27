<?php
declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Operations;

use App\Extensions\InteractionEngine\System\Contracts\GovernedOperationLedgerInterface;
use Illuminate\Contracts\Cache\Repository;

final class CacheGovernedOperationLedger implements GovernedOperationLedgerInterface
{
    public function __construct(private readonly Repository $cache,private readonly int $ttlSeconds=604800) {}

    public function record(string $companyId,string $operationId,array $operation): void
    {
        $companyId=$this->id($companyId,'company_id'); $operationId=$this->id($operationId,'operation_id');
        $key=$this->operationKey($companyId,$operationId);
        $existing=$this->cache->get($key,[]); if(!is_array($existing))$existing=[];
        $row=array_replace_recursive($existing,$operation,[
            'company_id'=>$companyId,'operation_id'=>$operationId,'updated_at'=>$operation['updated_at']??now()->toAtomString(),
        ]);
        $this->cache->put($key,$row,$this->ttlSeconds);
        $index=$this->cache->get($this->indexKey($companyId),[]); if(!is_array($index))$index=[];
        $index=array_values(array_unique(array_merge([$operationId],array_map('strval',$index))));
        $this->cache->put($this->indexKey($companyId),array_slice($index,0,500),$this->ttlSeconds);
    }

    public function find(string $companyId,string $operationId): ?array
    {
        $v=$this->cache->get($this->operationKey($this->id($companyId,'company_id'),$this->id($operationId,'operation_id')));
        return is_array($v)?$v:null;
    }

    public function list(string $companyId,?string $actorId=null,int $limit=100): array
    {
        $companyId=$this->id($companyId,'company_id');
        $ids=$this->cache->get($this->indexKey($companyId),[]); if(!is_array($ids))$ids=[];
        $rows=[];
        foreach(array_slice($ids,0,500) as $id){
            $row=$this->find($companyId,(string)$id); if(!is_array($row))continue;
            if($actorId!==null&&trim($actorId)!==''&&(string)($row['actor_id']??'')!==(string)$actorId)continue;
            $rows[]=$row;
            if(count($rows)>=max(1,min(500,$limit)))break;
        }
        return $rows;
    }

    private function operationKey(string $companyId,string $operationId): string { return 'interaction-engine:operation:'.hash('sha256',$companyId).':'.hash('sha256',$operationId); }
    private function indexKey(string $companyId): string { return 'interaction-engine:operations:'.hash('sha256',$companyId); }
    private function id(string $value,string $field): string { $value=trim($value); if($value==='')throw new \InvalidArgumentException($field.' is required.'); return $value; }
}

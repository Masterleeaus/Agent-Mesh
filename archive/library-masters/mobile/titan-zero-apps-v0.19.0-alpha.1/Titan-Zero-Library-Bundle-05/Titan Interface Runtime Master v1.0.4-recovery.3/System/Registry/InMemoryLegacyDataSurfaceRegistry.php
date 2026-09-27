<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\LegacyDataSurfaceRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;

final class InMemoryLegacyDataSurfaceRegistry implements LegacyDataSurfaceRegistryContract
{
    private LegacyDataSurfaceRegistrySnapshot $snapshot;
    public function __construct(private readonly ?ObjectRegistryContract $objects=null) { $this->snapshot=new LegacyDataSurfaceRegistrySnapshot([],[]); }
    public function rebuild(array $contributions): LegacyDataSurfaceRegistrySnapshot
    {
        $surfaces=[];$owners=[];$collisions=[];$rejected=[];
        foreach($contributions as $contributorKey=>$contribution){
            foreach((array)($contribution['legacy_data_surfaces']??[]) as $raw){
                try{
                    $d=$this->normalize((string)$contributorKey,$raw);
                    if(isset($owners[$d->key])){$collisions[$d->key]=array_values(array_unique([$owners[$d->key],$d->contributorKey]));unset($surfaces[$d->key]);continue;}
                    $owners[$d->key]=$d->contributorKey;$surfaces[$d->key]=$d;
                }catch(\Throwable $e){$rejected[(string)$contributorKey][]=$e->getMessage();}
            }
        }
        foreach(array_keys($collisions) as $key) unset($surfaces[$key]);
        $byObject=[];
        foreach($surfaces as $key=>$surface){
            $valid=true;
            if($this->objects!==null){foreach($surface->objectRefs as $objectKey){if($this->objects->get($objectKey)===null){$rejected[$surface->contributorKey][]="Legacy Data surface {$key} targets unknown object {$objectKey}.";$valid=false;}}}
            if(!$valid){unset($surfaces[$key]);continue;}
            foreach($surface->objectRefs as $objectKey)$byObject[$objectKey][]=$key;
        }
        ksort($surfaces,SORT_STRING);ksort($byObject,SORT_STRING);ksort($collisions,SORT_STRING);ksort($rejected,SORT_STRING);foreach($byObject as &$keys)sort($keys,SORT_STRING);unset($keys);
        return $this->snapshot=new LegacyDataSurfaceRegistrySnapshot($surfaces,$byObject,$collisions,$rejected);
    }
    public function find(string $key): ?LegacyDataSurfaceDescriptor{return $this->snapshot->surfaces[$key]??null;}
    public function forObject(string $objectKey): array{return array_values(array_filter(array_map(fn($k)=>$this->find($k),$this->snapshot->byObject[$objectKey]??[])));}
    public function snapshot(): LegacyDataSurfaceRegistrySnapshot{return $this->snapshot;}
    private function normalize(string $contributorKey,mixed $raw): LegacyDataSurfaceDescriptor
    {
        if(!is_array($raw))throw new \InvalidArgumentException('Legacy Data surface declaration must be an object.');
        foreach(['key','route_name','object_refs','permissions'] as $r)if(!array_key_exists($r,$raw))throw new \InvalidArgumentException("Legacy Data surface is missing {$r}.");
        $key=(string)$raw['key'];$route=(string)$raw['route_name'];
        if(!preg_match('/^[a-z0-9][a-z0-9._-]{0,127}$/',$key))throw new \InvalidArgumentException('Legacy Data surface key is unsafe.');
        if(!preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]{0,190}$/',$route))throw new \InvalidArgumentException('Legacy route name is unsafe.');
        return new LegacyDataSurfaceDescriptor($contributorKey,$key,$route,self::strings($raw['object_refs'],'object_refs'),self::strings($raw['permissions'],'permissions'));
    }
    private static function strings(mixed $v,string $field):array{if(!is_array($v))throw new \InvalidArgumentException("{$field} must be an array.");$o=[];foreach($v as $x){if(!is_string($x)||$x==='')throw new \InvalidArgumentException("{$field} contains invalid value.");$o[]=$x;}return array_values(array_unique($o));}
}

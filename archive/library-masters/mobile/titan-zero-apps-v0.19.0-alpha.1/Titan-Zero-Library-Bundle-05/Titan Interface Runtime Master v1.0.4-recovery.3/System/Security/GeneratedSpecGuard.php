<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Security;

final class GeneratedSpecGuard
{
    private const FORBIDDEN=['javascript','script','scripts','blade','react','vue','css','raw_sql','sql','credentials','eval','html'];
    private int $nodes=0;

    /** @param array<string,mixed> $spec */
    public function assertSafe(array $spec): void
    {
        $this->nodes=0;
        $this->walk($spec,0);
    }

    private function walk(array $node,int $depth): void
    {
        if($depth>24) throw new \InvalidArgumentException('Interface tree exceeds safe depth.');
        if(++$this->nodes>1000) throw new \InvalidArgumentException('Interface tree exceeds safe node count.');
        foreach($node as $key=>$value){
            $k=strtolower((string)$key);
            if(in_array($k,self::FORBIDDEN,true)) throw new \InvalidArgumentException('Forbidden generated UI key: '.$k);
            if(is_string($value)) {
                if(strlen($value)>65536) throw new \InvalidArgumentException('Generated UI string exceeds safe length.');
                if(preg_match('/\b(eval\s*\(|javascript:|<script|select\s+.+\s+from|delete\s+from|drop\s+table)\b/i',$value)) throw new \InvalidArgumentException('Executable or raw query content is forbidden.');
            }
            if(is_array($value)) $this->walk($value,$depth+1);
        }
    }
}

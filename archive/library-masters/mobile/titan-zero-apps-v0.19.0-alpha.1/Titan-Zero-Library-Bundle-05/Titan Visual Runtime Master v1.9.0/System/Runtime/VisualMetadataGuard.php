<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Runtime;
use InvalidArgumentException;
final class VisualMetadataGuard {
    private const FORBIDDEN_KEYS=['script','javascript','html','css','eval','sql','credentials','credential','token','secret','rawurl','raw_url','permission','permissions','authorization','authorisation','entitlement','autonomy','risk','cost','privacy','capability','capabilities'];
    private const MAX_BYTES=32768;
    private const MAX_DEPTH=12;
    private const MAX_NODES=1024;
    public function validate(array $value): array { $nodes=0; $this->walk($value,0,$nodes); return $value; }
    private function walk(array $value,int $depth,int &$nodes): void {
        if($depth>self::MAX_DEPTH) throw new InvalidArgumentException('Visual metadata exceeds maximum nesting depth.');
        $encoded=json_encode($value, JSON_THROW_ON_ERROR|JSON_UNESCAPED_SLASHES);
        if (strlen($encoded)>self::MAX_BYTES) throw new InvalidArgumentException('Visual metadata exceeds 32768 bytes.');
        foreach($value as $k=>$v){
            if(++$nodes>self::MAX_NODES) throw new InvalidArgumentException('Visual metadata exceeds maximum node count.');
            $key=strtolower((string)$k);
            if(in_array($key,self::FORBIDDEN_KEYS,true)) throw new InvalidArgumentException("Forbidden visual metadata key: {$k}");
            if(is_array($v)) $this->walk($v,$depth+1,$nodes);
            if(is_string($v) && preg_match('/(?:javascript:|<script|eval\s*\(|new\s+Function|data:text\/html|expression\s*\(|vbscript:)/i',$v)) throw new InvalidArgumentException('Executable visual payload rejected.');
        }
    }
}

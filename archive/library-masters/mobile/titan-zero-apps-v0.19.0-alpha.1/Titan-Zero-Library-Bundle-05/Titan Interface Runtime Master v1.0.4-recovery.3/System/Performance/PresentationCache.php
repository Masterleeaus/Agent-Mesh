<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Performance;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;

final class PresentationCache
{
    /** @var array<string,array{tree:PresentationTree,tick:int}> */ private array $entries=[];
    private int $tick=0;
    public function __construct(private readonly int $maxEntries=128){if($maxEntries<1||$maxEntries>5000)throw new \InvalidArgumentException('Presentation cache size is invalid.');}

    public function get(InterfaceContext $context,string $locale,string $fingerprint): ?PresentationTree
    {
        $key=$this->key($context,$locale,$fingerprint);if(!isset($this->entries[$key]))return null;$this->entries[$key]['tick']=++$this->tick;return $this->entries[$key]['tree'];
    }
    public function put(InterfaceContext $context,string $locale,string $fingerprint,PresentationTree $tree): void
    {
        $key=$this->key($context,$locale,$fingerprint);$this->entries[$key]=['tree'=>$tree,'tick'=>++$this->tick];$this->evict();
    }
    public function clear():void{$this->entries=[];$this->tick=0;}
    public function count():int{return count($this->entries);}
    private function key(InterfaceContext $c,string $locale,string $fingerprint):string
    {
        if(!preg_match('/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/',$locale))throw new \InvalidArgumentException('Locale is invalid.');
        if($fingerprint===''||strlen($fingerprint)>128)throw new \InvalidArgumentException('Presentation fingerprint is invalid.');
        return hash('sha256',implode("\0",[(string)$c->companyId,(string)$c->userId,$c->productSurface,$c->domain,$c->workspaceId??'',$locale,$fingerprint]));
    }
    private function evict():void
    {
        while(count($this->entries)>$this->maxEntries){$oldest=null;$tick=PHP_INT_MAX;foreach($this->entries as$key=>$entry)if($entry['tick']<$tick){$oldest=$key;$tick=$entry['tick'];}if($oldest===null)break;unset($this->entries[$oldest]);}
    }
}

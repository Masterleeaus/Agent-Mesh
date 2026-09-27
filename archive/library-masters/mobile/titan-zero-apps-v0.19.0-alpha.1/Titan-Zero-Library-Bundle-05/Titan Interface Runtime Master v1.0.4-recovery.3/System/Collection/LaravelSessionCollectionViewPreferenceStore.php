<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Collection;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Collection\CollectionViewPreferenceStoreContract;

final class LaravelSessionCollectionViewPreferenceStore implements CollectionViewPreferenceStoreContract
{
    /** @var array<string,string> */
    private array $fallback=[];
    public function __construct(private readonly ?object $session=null,private readonly string $prefix='titan_interface_runtime.collection_views'){}
    public function get(InterfaceContext $context,string $objectKey):?string
    {
        $key=$this->key($context,$objectKey);
        if ($this->session!==null && method_exists($this->session,'get')) { $value=$this->session->get($this->prefix.'.'.$key); return is_string($value)&&$value!==''?$value:null; }
        return $this->fallback[$key]??null;
    }
    public function put(InterfaceContext $context,string $objectKey,string $viewKey):void
    {
        $key=$this->key($context,$objectKey);
        if ($this->session!==null && method_exists($this->session,'put')) { $this->session->put($this->prefix.'.'.$key,$viewKey); return; }
        $this->fallback[$key]=$viewKey;
    }
    private function key(InterfaceContext $context,string $objectKey):string
    {
        return hash('sha256',implode('|',[(string)$context->companyId,(string)$context->userId,$context->productSurface,$objectKey]));
    }
}

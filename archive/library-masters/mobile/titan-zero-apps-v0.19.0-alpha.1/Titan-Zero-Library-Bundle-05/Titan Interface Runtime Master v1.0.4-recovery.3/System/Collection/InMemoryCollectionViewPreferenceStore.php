<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Collection;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Collection\CollectionViewPreferenceStoreContract;

final class InMemoryCollectionViewPreferenceStore implements CollectionViewPreferenceStoreContract
{
    /** @var array<string,string> */
    private array $preferences=[];
    public function get(InterfaceContext $context,string $objectKey):?string { return $this->preferences[$this->key($context,$objectKey)]??null; }
    public function put(InterfaceContext $context,string $objectKey,string $viewKey):void { $this->preferences[$this->key($context,$objectKey)]=$viewKey; }
    private function key(InterfaceContext $context,string $objectKey):string { return implode('|',[(string)$context->companyId,(string)$context->userId,$context->productSurface,$objectKey]); }
}

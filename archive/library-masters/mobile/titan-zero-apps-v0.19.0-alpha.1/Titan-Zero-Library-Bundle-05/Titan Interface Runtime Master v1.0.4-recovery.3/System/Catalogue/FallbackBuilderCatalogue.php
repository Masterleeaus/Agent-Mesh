<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Catalogue;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\BuilderCatalogue;
final class FallbackBuilderCatalogue implements BuilderCatalogue
{
    private const CORE=['titan.notice','titan.text','titan.metric','titan.list','titan.card','titan.form','titan.timeline','titan.table','titan.workspace'];
    public function has(string $component): bool { return in_array($component,self::CORE,true); }
    public function definition(string $component): ?array { return $this->has($component)?['key'=>$component,'source'=>'interface-runtime-safe-fallback']:null; }
}

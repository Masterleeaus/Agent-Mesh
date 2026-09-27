<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Visual;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\VisualRuntimeBridge;
final class PassThroughVisualRuntimeBridge implements VisualRuntimeBridge
{
    public function decorate(array $semanticTree,array $visualHints,array $environment=[]): array
    {
        $semanticTree['_visual']=['requested'=>$visualHints,'status'=>'visual-runtime-unavailable','graceful_fallback'=>true];
        return $semanticTree;
    }
}

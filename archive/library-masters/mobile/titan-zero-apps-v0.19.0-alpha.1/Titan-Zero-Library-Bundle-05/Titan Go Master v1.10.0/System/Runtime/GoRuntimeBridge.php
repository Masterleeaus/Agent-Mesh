<?php

declare(strict_types=1);

namespace App\Extensions\TitanGo\System\Runtime;

use App\Extensions\TitanGo\System\Contracts\GoRuntimeBridgeInterface;

final class GoRuntimeBridge implements GoRuntimeBridgeInterface
{
    public function appSurface(): string { return 'go'; }
    public function interactionContract(): string { return 'App\\Extensions\\InteractionEngine\\System\\Contracts\\PublicInteractionEngineInterface'; }
    public function interfaceRuntimeContract(): string { return 'App\\Extensions\\TitanInterfaceRuntime\\System\\Contracts\\InterfaceRuntime'; }
    public function visualRuntimeContract(): string { return 'App\\Extensions\\TitanVisualRuntime\\System\\Contracts\\VisualRuntime'; }
    public function builderContract(): string { return 'App\\Extensions\\TitanBuilder\\System\\Contracts\\SurfaceRegistry'; }
}

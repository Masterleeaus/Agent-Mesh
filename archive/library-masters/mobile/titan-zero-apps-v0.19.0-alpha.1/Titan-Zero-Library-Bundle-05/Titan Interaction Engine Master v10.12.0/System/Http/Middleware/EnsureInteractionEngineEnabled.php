<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Http\Middleware;

use App\Extensions\InteractionEngine\System\Lifecycle\ExtensionState;
use Closure;
use Illuminate\Http\Request;

final class EnsureInteractionEngineEnabled
{
    public function __construct(private readonly ExtensionState $state)
    {
    }

    public function handle(Request $request, Closure $next): mixed
    {
        if (!$this->state->enabled()) {
            abort(503, 'Titan Zero Interaction Engine is disabled.');
        }

        return $next($request);
    }
}

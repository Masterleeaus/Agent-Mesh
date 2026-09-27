<?php

namespace App\Extensions\TitanTrust\System\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Extensions\TitanTrust\System\Audit\RequestContext;

class CaptureAuditContext
{
    public function handle(Request $request, Closure $next)
    {
        // Lightweight: store context in request attributes for later use by controllers/services.
        $request->attributes->set('titantrust_audit_context', RequestContext::capture($request));
        return $next($request);
    }
}

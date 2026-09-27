<?php

namespace App\Extensions\TitanTrust\System\Audit;

use Illuminate\Http\Request;

class RequestContext
{
    public static function capture(Request $request): array
    {
        return [
            'ip' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
            'path' => (string) $request->path(),
            'method' => (string) $request->method(),
            'route_name' => optional($request->route())->getName(),
            'route_uri' => optional($request->route())->uri(),
        ];
    }
}

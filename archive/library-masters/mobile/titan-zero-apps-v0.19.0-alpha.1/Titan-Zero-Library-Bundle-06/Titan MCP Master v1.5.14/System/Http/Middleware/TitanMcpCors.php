<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Http\Middleware;

use App\Extensions\TitanMcp\System\Mcp\Support\TrustedOriginPolicy;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class TitanMcpCors
{
    public function __construct(private readonly TrustedOriginPolicy $origins) {}

    public function handle(Request $request, Closure $next): Response
    {
        $origin = trim((string) $request->headers->get('Origin', ''));
        if ($origin !== '' && !$this->origins->allows($origin)) {
            abort(403, 'Origin is not trusted for Titan MCP.');
        }

        if ($request->isMethod('OPTIONS')) {
            return response('', 204, $this->headers($origin));
        }

        /** @var Response $response */
        $response = $next($request);
        foreach ($this->headers($origin) as $name => $value) {
            if ($value !== '') $response->headers->set($name, $value);
        }
        return $response;
    }

    /** @return array<string,string> */
    private function headers(string $origin): array
    {
        return [
            'Access-Control-Allow-Origin' => $this->origins->responseOrigin($origin),
            'Vary' => 'Origin',
            'Access-Control-Allow-Methods' => 'POST, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Mcp-Session-Id, Last-Event-ID, Authorization, Accept, X-Request-Id',
            'Access-Control-Max-Age' => '600',
        ];
    }
}

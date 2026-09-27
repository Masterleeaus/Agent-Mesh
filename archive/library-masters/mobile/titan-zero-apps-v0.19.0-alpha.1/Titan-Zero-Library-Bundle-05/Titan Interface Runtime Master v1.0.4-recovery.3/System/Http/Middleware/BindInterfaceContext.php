<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Http\Middleware;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextResolverContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextStoreContract;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final readonly class BindInterfaceContext
{
    public function __construct(
        private InterfaceContextResolverContract $resolver,
        private InterfaceContextStoreContract $store,
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $route = $request->route();
        $overrides = [
            'product_surface' => is_object($route) ? (string) ($route->parameter('interface_product_surface') ?? 'command') : 'command',
            'domain' => is_object($route) ? (string) ($route->parameter('interface_domain') ?? 'platform') : 'platform',
        ];

        foreach (['branch_id', 'workspace_id', 'team_id', 'device_id', 'object_ref', 'conversation_id', 'journey_id', 'trace_id', 'correlation_id', 'causation_id'] as $field) {
            if ($request->attributes->has($field)) {
                $value = $request->attributes->get($field);
                if (is_scalar($value) || $value === null) $overrides[$field] = $value;
            }
        }

        $this->store->set($this->resolver->resolve($overrides));
        try {
            return $next($request);
        } finally {
            $this->store->clear();
        }
    }
}

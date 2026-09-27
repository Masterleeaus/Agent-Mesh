<?php

declare(strict_types=1);
namespace App\Extensions\TitanHub\System\Http\Middleware;

use App\Extensions\TitanHub\System\Contracts\TrustedCustomerContextResolver;
use Closure;
use Illuminate\Http\Request;

final class ResolveHubCustomerContext
{
    public function __construct(private TrustedCustomerContextResolver $resolver) {}
    public function handle(Request $request,Closure $next)
    {
        $portal=(string)$request->route('portal','default');
        $request->attributes->set('titan_hub_context',$this->resolver->resolve($request,$portal));
        return $next($request);
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Auth\Authenticatable;
use Throwable;

final class CapabilityGate
{
    public function __construct(private readonly ?McpTokenScopeGate $tokenScopeGate=null){}
    public function assert(Authenticatable|null $user,string $capability):void
    {
        if($user===null) throw new AuthorizationException('Titan MCP requires an authenticated user.');
        $this->tokenScopeGate?->assert($user);
        $privateIds=array_map('strval',config('titan_mcp.auth.private_user_ids',[]));
        if(in_array((string)$user->getAuthIdentifier(),$privateIds,true))return;
        if($this->isSuperAdmin($user))return;
        if($this->can($user,$capability)||$this->can($user,'titan.mcp.*'))return;
        throw new AuthorizationException("Missing Titan MCP capability: {$capability}");
    }
    private function isSuperAdmin(Authenticatable $user):bool
    {
        if(method_exists($user,'isSuperAdmin')){try{if((bool)$user->isSuperAdmin())return true;}catch(Throwable){}}
        return false;
    }
    private function can(Authenticatable $user,string $capability):bool
    {
        foreach(['checkPermission','hasPermissionTo','can'] as $method){if(!method_exists($user,$method))continue;try{if((bool)$user->{$method}($capability))return true;}catch(Throwable){}}
        return false;
    }
}

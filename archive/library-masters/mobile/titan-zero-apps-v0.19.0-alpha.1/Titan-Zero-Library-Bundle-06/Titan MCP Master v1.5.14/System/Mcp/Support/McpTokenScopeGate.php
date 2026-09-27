<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use Illuminate\Auth\Access\AuthorizationException;
use InvalidArgumentException;
use Throwable;

final class McpTokenScopeGate
{
    public function __construct(
        private readonly bool $required = false,
        private readonly string $scope = 'mcp:use',
    ) {
        if ($this->scope === '' || preg_match('/^[A-Za-z0-9._:-]+$/', $this->scope) !== 1) {
            throw new InvalidArgumentException('Invalid Titan MCP token scope configuration.');
        }
    }

    public function assert(?object $user): void
    {
        if (!$this->required) return;
        if ($user === null) {
            throw new AuthorizationException('Titan MCP requires an authenticated scoped token.');
        }
        if (!method_exists($user, 'tokenCan')) {
            throw new AuthorizationException('Titan MCP token scope enforcement is enabled but the authenticated token cannot expose scopes.');
        }
        try {
            if ((bool) $user->tokenCan($this->scope)) return;
        } catch (Throwable) {
            // Fail closed below.
        }
        throw new AuthorizationException('Authenticated token is missing the required Titan MCP scope.');
    }

    /** @return array{required:bool,scope:string} */
    public function posture(): array
    {
        return ['required' => $this->required, 'scope' => $this->scope];
    }
}

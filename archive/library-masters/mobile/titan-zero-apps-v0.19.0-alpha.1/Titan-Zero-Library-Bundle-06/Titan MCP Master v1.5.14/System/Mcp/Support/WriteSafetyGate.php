<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use RuntimeException;

final class WriteSafetyGate
{
    public function assertFilesystemWrite(bool $destructive = false): void
    {
        $this->assertGlobalWrite();
        if ($destructive) $this->assertDestructive();
    }

    public function assertDatabaseWrite(bool $destructive = false): void
    {
        $this->assertGlobalWrite();
        if (!config('titan_mcp.write.database_enabled', true)) {
            throw new RuntimeException('Titan MCP database writes are disabled.');
        }
        if ($destructive) $this->assertDestructive();
    }

    public function assertCommandWrite(bool $destructive = false): void
    {
        $this->assertGlobalWrite();
        if (!config('titan_mcp.execution.enabled', true)) {
            throw new RuntimeException('Titan MCP command execution is disabled.');
        }
        if ($destructive) $this->assertDestructive();
    }

    private function assertGlobalWrite(): void
    {
        if (app()->environment('production') && !config('titan_mcp.security.storage_encryption_attested', false)) {
            throw new RuntimeException('Titan MCP production writes require storage encryption-at-rest attestation.');
        }
        if (!config('titan_mcp.write.enabled', true)) {
            throw new RuntimeException('Titan MCP writes are disabled by configuration.');
        }
    }

    private function assertDestructive(): void
    {
        if (!config('titan_mcp.destructive.enabled', false)) {
            throw new RuntimeException('Destructive Titan MCP operations are disabled by configuration.');
        }
    }
}

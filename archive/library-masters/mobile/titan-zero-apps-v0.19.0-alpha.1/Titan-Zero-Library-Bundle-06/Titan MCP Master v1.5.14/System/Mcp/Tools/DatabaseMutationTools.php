<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Tools;

use App\Extensions\TitanMcp\System\Mcp\Support\CapabilityGate;
use App\Extensions\TitanMcp\System\Mcp\Support\DatabaseMutationService;
use App\Extensions\TitanMcp\System\Mcp\Support\OperationMetadataValidator;
use App\Extensions\TitanMcp\System\Mcp\Support\OperationLockManager;
use App\Extensions\TitanMcp\System\Mcp\Support\SqlGuard;
use App\Extensions\TitanMcp\System\Mcp\Support\WriteSafetyGate;
use Illuminate\Support\Facades\Auth;

final class DatabaseMutationTools
{
    public function __construct(
        private readonly DatabaseMutationService $mutations,
        private readonly CapabilityGate $gate,
        private readonly SqlGuard $sqlGuard,
        private readonly WriteSafetyGate $writeSafety,
        private readonly OperationMetadataValidator $metadata,
        private readonly OperationLockManager $locks,
    ) {}
    public function mutate(string $sql, string $reason, array $bindings = [], ?string $connection = null, ?string $runId = null): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.database.write');
        $analysis = $this->sqlGuard->assertMutation($sql);
        $destructiveAuthorized = false;
        if ($analysis['destructive']) {
            $this->gate->assert(Auth::user(), 'titan.mcp.database.destructive');
            $destructiveAuthorized = true;
        }
        $this->writeSafety->assertDatabaseWrite($analysis['destructive']);
        $validated = $this->metadata->normalize($reason, $runId, request()?->headers->get('X-Request-Id'));
        return $this->locks->withMutationLock(fn () => $this->mutations->execute(
            $analysis['statement'], $bindings, $connection, [
                'actor_id' => Auth::id(),
                'tool' => 'titan_database_mutate',
                'destructive_authorized' => $destructiveAuthorized,
            ] + $validated
        ));
    }
    public function rollback(string $backupId, string $reason, ?string $runId = null): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.database.destructive');
        $this->writeSafety->assertDatabaseWrite(true);
        $validated = $this->metadata->normalize($reason, $runId, request()?->headers->get('X-Request-Id'));
        return $this->locks->withMutationLock(fn () => $this->mutations->rollback($backupId, [
            'actor_id' => Auth::id(),
            'tool' => 'titan_database_rollback',
        ] + $validated));
    }
}

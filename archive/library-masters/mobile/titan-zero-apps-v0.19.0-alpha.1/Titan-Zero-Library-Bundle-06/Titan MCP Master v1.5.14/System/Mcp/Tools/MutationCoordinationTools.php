<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Tools;

use App\Extensions\TitanMcp\System\Http\Transport\McpToolInvoker;
use App\Extensions\TitanMcp\System\Mcp\Support\CapabilityGate;
use App\Extensions\TitanMcp\System\Mcp\Support\CommandExecutionPolicy;
use App\Extensions\TitanMcp\System\Mcp\Support\McpCatalogue;
use App\Extensions\TitanMcp\System\Mcp\Support\MutationPreparationService;
use App\Extensions\TitanMcp\System\Mcp\Support\OperationMetadataValidator;
use App\Extensions\TitanMcp\System\Mcp\Support\OperationLockManager;
use App\Extensions\TitanMcp\System\Mcp\Support\SqlGuard;
use App\Extensions\TitanMcp\System\Mcp\Support\WriteSafetyGate;
use Illuminate\Support\Facades\Auth;
use InvalidArgumentException;
use RuntimeException;

final class MutationCoordinationTools
{
    public function __construct(
        private readonly MutationPreparationService $preparation,
        private readonly McpToolInvoker $invoker,
        private readonly CapabilityGate $gate,
        private readonly WriteSafetyGate $writeSafety,
        private readonly SqlGuard $sqlGuard,
        private readonly CommandExecutionPolicy $commandPolicy,
        private readonly OperationMetadataValidator $metadata,
        private readonly OperationLockManager $locks,
    ) {}

    /** @param array<string,mixed> $arguments */
    public function prepare(string $tool, array $arguments, ?string $runId = null, ?int $ttlSeconds = null): array
    {
        $this->authorizeIntent($tool, $arguments);
        $reason = is_string($arguments['reason'] ?? null) ? $arguments['reason'] : 'Prepare coordinated Titan MCP mutation';
        $meta = $this->metadata->normalize($reason, $runId, request()?->headers->get('X-Request-Id'));
        return $this->locks->withMutationLock(fn () => $this->preparation->prepare(
            $tool, $arguments, Auth::id(), ['actor_id'=>Auth::id(),'tool'=>'titan_mutation_prepare'] + $meta, $ttlSeconds ?? (int)config('titan_mcp.mutation_tickets.default_ttl_seconds',300)
        ));
    }

    public function commit(string $ticketId): array
    {
        $ticket = $this->preparation->assertCommittable($ticketId, Auth::id());
        $tool = (string) ($ticket['tool'] ?? '');
        $arguments = (array) ($ticket['arguments'] ?? []);
        $this->authorizeIntent($tool, $arguments);
        // Atomic ticket transition prevents double-commit races. Do not take the host mutation lock here;
        // the underlying canonical mutation tool takes it exactly once.
        $this->preparation->markCommitting($ticketId);
        try {
            $result = $this->invoker->call($tool, $arguments);
            if (!is_array($result)) $result = ['result'=>$result];
            $committed = $this->preparation->markCommitted($ticketId, $result);
            $publicTicket=$this->preparation->publicView($committed);
            return [
                'ticket'=>$publicTicket,
                'mutation_result'=>$result,
                'preapproval_backup_verified'=>true,
                'single_use'=>true,
                'post_commit_evidence'=>[
                    'schema'=>'titan-mcp-post-commit-evidence/1',
                    'server_committed'=>($committed['status']??null)==='committed',
                    'verification_level'=>'server-commit-evidence',
                    'result_sha256'=>$committed['result_sha256']??null,
                    'preapproval_backups'=>$committed['preapproval_backups']??[],
                    'mutation_backups'=>$committed['mutation_backups']??[],
                    'ticket_id'=>$committed['ticket_id']??$ticketId,
                ],
            ];
        } catch (\Throwable $e) {
            $this->preparation->markFailed($ticketId, $e->getMessage());
            throw $e;
        }
    }

    public function status(string $ticketId): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.read');
        $ticket = $this->preparation->assertOwned($ticketId, Auth::id());
        return $this->preparation->publicView($ticket);
    }

    /** @param array<string,mixed> $arguments */
    private function authorizeIntent(string $tool, array $arguments): void
    {
        if (!$this->preparation->supports($tool)) throw new InvalidArgumentException("Tool '{$tool}' is not ticketable.");
        $definition = null;
        foreach (McpCatalogue::tools() as $candidate) if ($candidate['name'] === $tool) { $definition = $candidate; break; }
        if (!is_array($definition)) throw new InvalidArgumentException("Unknown mutation tool '{$tool}'.");
        $this->gate->assert(Auth::user(), (string) $definition['capability']);

        if (str_starts_with($tool, 'titan_repository_')) {
            $destructive = in_array($tool, ['titan_repository_delete','titan_repository_rollback'], true);
            $this->writeSafety->assertFilesystemWrite($destructive);
            return;
        }
        if ($tool === 'titan_database_mutate') {
            $sql=$arguments['sql']??null; if(!is_string($sql)) throw new InvalidArgumentException('Database mutation requires sql.');
            $analysis=$this->sqlGuard->assertMutation($sql);
            if($analysis['destructive']) $this->gate->assert(Auth::user(),'titan.mcp.database.destructive');
            $this->writeSafety->assertDatabaseWrite((bool)$analysis['destructive']);
            return;
        }
        if ($tool === 'titan_database_rollback') {
            $this->gate->assert(Auth::user(),'titan.mcp.database.destructive'); $this->writeSafety->assertDatabaseWrite(true); return;
        }
        if ($tool === 'titan_artisan_mutate') {
            $command=$arguments['command']??null; if(!is_string($command)) throw new InvalidArgumentException('Artisan mutation requires command.');
            $args=$arguments['arguments']??[]; if(!is_array($args)) throw new InvalidArgumentException('Artisan arguments must be an array.');
            $this->commandPolicy->mutationPlan($command,$args,(array)($arguments['backupPaths']??[]),(bool)($arguments['databaseMayChange']??false));
            if($this->commandPolicy->isDestructiveMutation($command)) $this->gate->assert(Auth::user(),'titan.mcp.execute.destructive');
            $this->writeSafety->assertCommandWrite($this->commandPolicy->isDestructiveMutation($command));
            return;
        }
        throw new RuntimeException('Unsupported coordinated mutation intent.');
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Tools;

use App\Extensions\TitanMcp\System\Mcp\Support\CapabilityGate;
use App\Extensions\TitanMcp\System\Mcp\Support\CommandExecutionPolicy;
use App\Extensions\TitanMcp\System\Mcp\Support\CommandMutationService;
use App\Extensions\TitanMcp\System\Mcp\Support\OperationMetadataValidator;
use App\Extensions\TitanMcp\System\Mcp\Support\OperationLockManager;
use App\Extensions\TitanMcp\System\Mcp\Support\SecretRedactor;
use App\Extensions\TitanMcp\System\Mcp\Support\WriteSafetyGate;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\Process\Process;

final class CommandTools
{
    public function __construct(
        private readonly CommandMutationService $mutations,
        private readonly CapabilityGate $gate,
        private readonly SecretRedactor $redactor,
        private readonly CommandExecutionPolicy $policy,
        private readonly WriteSafetyGate $writeSafety,
        private readonly OperationMetadataValidator $metadata,
        private readonly OperationLockManager $locks,
    ) {}
    public function readonly(string $command, array $arguments = []): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.execute.read');
        if (!config('titan_mcp.execution.enabled', true)) {
            throw new \RuntimeException('Titan MCP command execution is disabled.');
        }
        $this->policy->assertReadonly($command, $arguments);

        $process = new Process(
            array_merge([PHP_BINARY, 'artisan', $command], $arguments),
            base_path(),
            null,
            null,
            (float) config('titan_mcp.execution.readonly_timeout_seconds', 120),
        );
        $process->run();
        $max = (int) config('titan_mcp.execution.max_output_chars', 20000);
        $exitCode = $process->getExitCode();
        return $this->redactor->redact([
            'succeeded' => $exitCode === 0,
            'exit_code' => $exitCode,
            'stdout' => substr($process->getOutput(), 0, $max),
            'stderr' => substr($process->getErrorOutput(), 0, $max),
        ]);
    }
    public function mutate(string $command, array $arguments, string $reason, ?string $runId = null, array $backupPaths = [], bool $databaseMayChange = false): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.execute.write');
        $destructive = $this->policy->isDestructiveMutation($command);
        $destructiveAuthorized = false;
        if ($destructive) {
            $this->gate->assert(Auth::user(), 'titan.mcp.execute.destructive');
            $destructiveAuthorized = true;
        }
        $this->writeSafety->assertCommandWrite($destructive);
        $validated = $this->metadata->normalize($reason, $runId, request()?->headers->get('X-Request-Id'));
        return $this->locks->withMutationLock(fn () => $this->mutations->artisan(
            $command, $arguments, $backupPaths, $databaseMayChange, [
                'actor_id' => Auth::id(),
                'tool' => 'titan_artisan_mutate',
                'destructive_authorized' => $destructiveAuthorized,
            ] + $validated
        ));
    }
}

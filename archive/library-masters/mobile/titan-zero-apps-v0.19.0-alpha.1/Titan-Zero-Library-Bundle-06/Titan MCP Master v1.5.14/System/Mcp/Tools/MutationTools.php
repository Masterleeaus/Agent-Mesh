<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Tools;

use App\Extensions\TitanMcp\System\Mcp\Support\CapabilityGate;
use App\Extensions\TitanMcp\System\Mcp\Support\MutationService;
use App\Extensions\TitanMcp\System\Mcp\Support\OperationMetadataValidator;
use App\Extensions\TitanMcp\System\Mcp\Support\OperationLockManager;
use App\Extensions\TitanMcp\System\Mcp\Support\WriteSafetyGate;
use Illuminate\Support\Facades\Auth;

final class MutationTools
{
    public function __construct(
        private readonly MutationService $mutations,
        private readonly CapabilityGate $gate,
        private readonly WriteSafetyGate $writeSafety,
        private readonly OperationMetadataValidator $metadata,
        private readonly OperationLockManager $locks,
    ) {}
    public function write(string $path, string $content, string $reason, ?string $expectedSha256 = null, ?string $runId = null): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.repository.write');
        $this->writeSafety->assertFilesystemWrite();
        return $this->locks->withMutationLock(fn () => $this->mutations->writeFile(
            $path, $content, $expectedSha256, $this->meta('titan_repository_write', $reason, $runId)
        ));
    }
    public function replace(string $path, string $search, string $replace, string $reason, int $expectedOccurrences = 1, ?string $expectedSha256 = null, ?string $runId = null): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.repository.write');
        $this->writeSafety->assertFilesystemWrite();
        return $this->locks->withMutationLock(fn () => $this->mutations->replaceText(
            $path, $search, $replace, $expectedOccurrences, $expectedSha256, $this->meta('titan_repository_replace', $reason, $runId)
        ));
    }

    /** @param array<int,array<string,mixed>> $files */
    public function batchWrite(array $files, string $reason, ?string $runId = null): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.repository.write');
        $this->writeSafety->assertFilesystemWrite();
        return $this->locks->withMutationLock(fn () => $this->mutations->batchWriteFiles(
            $files, $this->meta('titan_repository_batch_write', $reason, $runId)
        ));
    }

    public function mkdir(string $path, string $reason, ?string $runId = null): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.repository.write');
        $this->writeSafety->assertFilesystemWrite();
        return $this->locks->withMutationLock(fn () => $this->mutations->makeDirectory(
            $path, $this->meta('titan_repository_mkdir', $reason, $runId)
        ));
    }

    public function delete(string $path, string $reason, ?string $runId = null): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.repository.destructive');
        $this->writeSafety->assertFilesystemWrite(true);
        return $this->locks->withMutationLock(fn () => $this->mutations->deletePath(
            $path, $this->meta('titan_repository_delete', $reason, $runId)
        ));
    }
    public function rollback(string $backupId, string $reason, ?string $runId = null): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.repository.destructive');
        $this->writeSafety->assertFilesystemWrite(true);
        return $this->locks->withMutationLock(fn () => $this->mutations->rollback(
            $backupId, $this->meta('titan_repository_rollback', $reason, $runId)
        ));
    }

    private function meta(string $tool, string $reason, ?string $runId): array
    {
        $validated = $this->metadata->normalize($reason, $runId, request()?->headers->get('X-Request-Id'));
        return [
            'actor_id' => Auth::id(),
            'tool' => $tool,
        ] + $validated;
    }
}

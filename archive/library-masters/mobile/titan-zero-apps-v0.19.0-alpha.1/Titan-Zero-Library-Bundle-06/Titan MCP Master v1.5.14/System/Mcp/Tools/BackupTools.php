<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Tools;

use App\Extensions\TitanMcp\System\Mcp\Support\BackupManager;
use App\Extensions\TitanMcp\System\Mcp\Support\CapabilityGate;
use App\Extensions\TitanMcp\System\Mcp\Support\DatabaseBackupManager;
use App\Extensions\TitanMcp\System\Mcp\Support\SecretRedactor;
use Illuminate\Support\Facades\Auth;

final class BackupTools
{
    public function __construct(
        private readonly BackupManager $filesystem,
        private readonly DatabaseBackupManager $database,
        private readonly CapabilityGate $gate,
        private readonly SecretRedactor $redactor,
    ) {}
    public function verify(string $backupId, string $type = 'filesystem'): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.backups.read');
        if (!in_array($type, ['filesystem', 'database'], true)) {
            throw new \InvalidArgumentException('Backup type must be filesystem or database.');
        }
        return $type === 'database' ? $this->database->verify($backupId) : $this->filesystem->verify($backupId);
    }
    public function manifest(string $backupId, string $type = 'filesystem'): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.backups.read');
        if (!in_array($type, ['filesystem', 'database'], true)) {
            throw new \InvalidArgumentException('Backup type must be filesystem or database.');
        }
        return $this->redactor->redact(
            $type === 'database' ? $this->database->manifest($backupId) : $this->filesystem->manifest($backupId)
        );
    }
}

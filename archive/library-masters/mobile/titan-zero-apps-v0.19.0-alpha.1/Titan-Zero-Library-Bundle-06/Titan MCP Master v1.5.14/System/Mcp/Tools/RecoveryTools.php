<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Tools;

use App\Extensions\TitanMcp\System\Mcp\Support\CapabilityGate;
use App\Extensions\TitanMcp\System\Mcp\Support\RecoveryInspector;
use Illuminate\Support\Facades\Auth;

final class RecoveryTools
{
    public function __construct(private readonly CapabilityGate $gate, private readonly RecoveryInspector $inspector) {}

    public function auditStatus(): array
    {
        $this->gate->assert(Auth::user(),'titan.mcp.backups.read');
        return $this->inspector->auditStatus();
    }
    public function backupsList(string $type = 'all', int $limit = 100): array
    {
        $this->gate->assert(Auth::user(),'titan.mcp.backups.read');
        return $this->inspector->backupsList($type,$limit);
    }
}

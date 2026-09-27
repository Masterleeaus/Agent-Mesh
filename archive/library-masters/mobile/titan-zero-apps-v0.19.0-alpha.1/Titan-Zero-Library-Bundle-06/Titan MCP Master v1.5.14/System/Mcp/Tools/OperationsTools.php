<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Tools;

use App\Extensions\TitanMcp\System\Mcp\Support\CapabilityGate;
use App\Extensions\TitanMcp\System\Mcp\Support\OperationsInspector;
use Illuminate\Support\Facades\Auth;

final class OperationsTools
{
    public function __construct(private readonly CapabilityGate $gate, private readonly OperationsInspector $inspector) {}

    public function configSearch(string $query = '', int $limit = 100): array
    {
        $this->gate->assert(Auth::user(),'titan.mcp.runtime.read');
        return $this->inspector->configSearch($query,$limit);
    }
    public function migrationsStatus(int $limit = 250): array
    {
        $this->gate->assert(Auth::user(),'titan.mcp.database.read');
        return $this->inspector->migrationsStatus($limit);
    }
    public function queueStatus(): array
    {
        $this->gate->assert(Auth::user(),'titan.mcp.runtime.read');
        return $this->inspector->queueStatus();
    }
    public function schedulerList(int $limit = 200): array
    {
        $this->gate->assert(Auth::user(),'titan.mcp.runtime.read');
        return $this->inspector->schedulerList($limit);
    }
    public function permissionsSummary(): array
    {
        $this->gate->assert(Auth::user(),'titan.mcp.admin');
        return $this->inspector->permissionsSummary();
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Tools;

use App\Extensions\TitanMcp\System\Mcp\Support\CapabilityGate;
use App\Extensions\TitanMcp\System\Mcp\Support\RepositoryReader;
use App\Extensions\TitanMcp\System\Mcp\Support\SecretRedactor;
use Illuminate\Support\Facades\Auth;

final class RepositoryTools
{
    public function __construct(
        private readonly RepositoryReader $reader,
        private readonly CapabilityGate $gate,
        private readonly SecretRedactor $redactor,
    ) {}
    public function read(string $path, int $maxBytes = 200000): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.repository.read');
        return $this->redactor->redact($this->reader->read($path, min(max($maxBytes, 1), 1000000)));
    }
    public function list(string $path = 'app', int $limit = 500): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.repository.read');
        return $this->reader->list($path, min(max($limit, 1), 2000));
    }
    public function search(string $query, int $limit = 100): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.repository.read');
        return $this->redactor->redact(
            $this->reader->search($query, (array) config('titan_mcp.repository.search_roots'), min(max($limit, 1), 250))
        );
    }
}

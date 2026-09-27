<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Context;

use Illuminate\Support\Facades\Cache;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;

class ContextGraph
{
    private array $nodes = [];
    private array $edges = [];

    public function __construct(private readonly CompanyExecutionContext $tenantContext)
    {
        $this->loadGraph();
    }

    public function addNode(string $id, array $data): void
    {
        $this->nodes[$id] = $data;
        $this->saveGraph();
    }

    public function addEdge(string $from, string $to, string $relationship): void
    {
        if (!isset($this->nodes[$from], $this->nodes[$to])) {
            throw new \InvalidArgumentException('Both context nodes must exist before adding an edge.');
        }
        $this->edges[] = compact('from', 'to', 'relationship');
        $this->saveGraph();
    }

    public function traverse(string $start, int $depth = 3): array
    {
        if (!isset($this->nodes[$start]) || $depth < 1) {
            return [];
        }
        $result = [];
        $visited = [$start => true];
        $queue = [[$start, 0]];
        while ($queue !== []) {
            [$node, $level] = array_shift($queue);
            if ($level >= $depth) {
                continue;
            }
            foreach ($this->getNeighbors($node) as $neighbor) {
                if (isset($visited[$neighbor])) {
                    continue;
                }
                $visited[$neighbor] = true;
                $result[] = ['node' => $neighbor, 'data' => $this->nodes[$neighbor] ?? null, 'level' => $level + 1];
                $queue[] = [$neighbor, $level + 1];
            }
        }
        return $result;
    }

    public function suggestPath(string $start, string $end): array
    {
        if (!isset($this->nodes[$start], $this->nodes[$end])) {
            return [];
        }
        $queue = [[$start, [$start]]];
        $visited = [];
        while ($queue !== []) {
            [$node, $path] = array_shift($queue);
            if ($node === $end) {
                return array_map(fn(string $id): array => ['id' => $id, 'data' => $this->nodes[$id]], $path);
            }
            if (isset($visited[$node])) {
                continue;
            }
            $visited[$node] = true;
            foreach ($this->getNeighbors($node) as $neighbor) {
                if (!isset($visited[$neighbor])) {
                    $queue[] = [$neighbor, [...$path, $neighbor]];
                }
            }
        }
        return [];
    }

    public function getNeighbors(string $node): array
    {
        $neighbors = [];
        foreach ($this->edges as $edge) {
            if ($edge['from'] === $node) {
                $neighbors[] = $edge['to'];
            }
        }
        return array_values(array_unique($neighbors));
    }

    public function getNodes(): array { return $this->nodes; }
    public function getEdges(): array { return $this->edges; }

    private function saveGraph(): void
    {
        try {
            Cache::put($this->tenantContext->cacheKey('context_graph'), ['nodes' => $this->nodes, 'edges' => $this->edges], 86400 * 30);
        } catch (\Throwable) {
        }
    }

    private function loadGraph(): void
    {
        try {
            $data = Cache::get($this->tenantContext->cacheKey('context_graph'), ['nodes' => [], 'edges' => []]);
            $this->nodes = $data['nodes'] ?? [];
            $this->edges = $data['edges'] ?? [];
        } catch (\Throwable) {
            $this->nodes = [];
            $this->edges = [];
        }
    }
}

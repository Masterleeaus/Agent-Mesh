<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Memory\Implementations;

use Illuminate\Support\Facades\Cache;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;
use App\Extensions\InteractionEngine\System\Engines\Memory\Contracts\KnowledgeGraphEngineInterface;

class KnowledgeGraphEngine implements KnowledgeGraphEngineInterface
{
    private array $nodes = [];
    private array $edges = [];

    public function __construct(private readonly CompanyExecutionContext $tenantContext)
    {
        $this->loadGraph();
    }

    public function addNode(string $id, string $type, array $properties): void
    {
        $this->nodes[$id] = ['id' => $id, 'type' => $type, 'properties' => $properties];
        $this->saveGraph();
    }

    public function addEdge(string $from, string $to, string $relationship): void
    {
        if (!isset($this->nodes[$from], $this->nodes[$to])) {
            throw new \InvalidArgumentException('Both graph nodes must exist before adding an edge.');
        }
        $this->edges[] = compact('from', 'to', 'relationship');
        $this->saveGraph();
    }

    public function query(string $start, string $relationship, int $depth): array
    {
        if (!isset($this->nodes[$start]) || $depth < 0) {
            return [];
        }
        $results = [];
        $visited = [$start => true];
        $queue = [[$start, 0]];
        while ($queue !== []) {
            [$nodeId, $level] = array_shift($queue);
            if ($level >= $depth) {
                continue;
            }
            foreach ($this->edges as $edge) {
                if ($edge['from'] !== $nodeId || ($relationship !== '*' && $edge['relationship'] !== $relationship)) {
                    continue;
                }
                $target = $edge['to'];
                if (isset($visited[$target])) {
                    continue;
                }
                $visited[$target] = true;
                $results[] = ['node' => $this->nodes[$target], 'edge' => $edge, 'depth' => $level + 1];
                $queue[] = [$target, $level + 1];
            }
        }
        return $results;
    }

    public function recommend(string $entity, string $context): array
    {
        if (!isset($this->nodes[$entity])) {
            return [];
        }
        $contextTokens = $this->tokens($context);
        $results = [];
        foreach ($this->query($entity, '*', 2) as $result) {
            $text = json_encode($result['node'], JSON_UNESCAPED_SLASHES) ?: '';
            $tokens = $this->tokens($text);
            $union = count(array_unique(array_merge($contextTokens, $tokens)));
            $score = $union > 0 ? count(array_intersect($contextTokens, $tokens)) / $union : 0;
            $result['score'] = round($score + (1 / (1 + $result['depth'])), 4);
            $results[] = $result;
        }
        usort($results, static fn(array $a, array $b): int => $b['score'] <=> $a['score']);
        return $results;
    }

    private function loadGraph(): void
    {
        try {
            $data = Cache::get($this->tenantContext->cacheKey('knowledge_graph'), ['nodes' => [], 'edges' => []]);
            $this->nodes = $data['nodes'] ?? [];
            $this->edges = $data['edges'] ?? [];
        } catch (\Throwable) {
            $this->nodes = [];
            $this->edges = [];
        }
    }

    private function saveGraph(): void
    {
        try {
            Cache::put($this->tenantContext->cacheKey('knowledge_graph'), ['nodes' => $this->nodes, 'edges' => $this->edges], 86400 * 30);
        } catch (\Throwable) {
        }
    }

    private function tokens(string $text): array
    {
        return array_values(array_unique(preg_split('/[^a-z0-9]+/i', strtolower($text), -1, PREG_SPLIT_NO_EMPTY) ?: []));
    }
}

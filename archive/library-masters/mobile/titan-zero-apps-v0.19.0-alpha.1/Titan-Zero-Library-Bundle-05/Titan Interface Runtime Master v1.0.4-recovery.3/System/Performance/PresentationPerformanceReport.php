<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Performance;

final readonly class PresentationPerformanceReport implements \JsonSerializable
{
    public function __construct(
        public int $payloadBytes,
        public int $nodeCount,
        public int $maxDepth,
        public float $p95Ms,
        public int $maxPayloadBytes,
        public int $maxNodes,
        public int $maxAllowedDepth,
        public float $p95BudgetMs,
    ) {}

    public function withinBudget(): bool
    {
        return $this->payloadBytes <= $this->maxPayloadBytes && $this->nodeCount <= $this->maxNodes && $this->maxDepth <= $this->maxAllowedDepth && $this->p95Ms <= $this->p95BudgetMs;
    }

    public function jsonSerialize(): array
    {
        return ['within_budget'=>$this->withinBudget(),'payload_bytes'=>$this->payloadBytes,'node_count'=>$this->nodeCount,'max_depth'=>$this->maxDepth,'p95_ms'=>$this->p95Ms,
            'budgets'=>['payload_bytes'=>$this->maxPayloadBytes,'nodes'=>$this->maxNodes,'depth'=>$this->maxAllowedDepth,'p95_ms'=>$this->p95BudgetMs]];
    }
}

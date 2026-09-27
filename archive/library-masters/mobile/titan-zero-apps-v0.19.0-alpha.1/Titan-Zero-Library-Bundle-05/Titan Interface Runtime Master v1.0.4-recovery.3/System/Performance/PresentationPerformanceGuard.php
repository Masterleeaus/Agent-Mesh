<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Performance;

use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationNode;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;

final readonly class PresentationPerformanceGuard
{
    public function __construct(
        public int $maxPayloadBytes = 524288,
        public int $maxNodes = 2000,
        public int $maxDepth = 16,
        public float $p95BudgetMs = 100.0,
    ) {
        if ($maxPayloadBytes < 4096 || $maxNodes < 1 || $maxDepth < 1 || $p95BudgetMs <= 0) throw new \InvalidArgumentException('Presentation performance budget is invalid.');
    }

    /** @param list<float|int> $latencySamplesMs */
    public function inspect(PresentationTree $tree,array $latencySamplesMs=[]): PresentationPerformanceReport
    {
        $json=$tree->toCanonicalJson();$nodes=0;$depth=0;$this->walk($tree->root,1,$nodes,$depth);
        return new PresentationPerformanceReport(strlen($json),$nodes,$depth,self::p95($latencySamplesMs),$this->maxPayloadBytes,$this->maxNodes,$this->maxDepth,$this->p95BudgetMs);
    }

    private function walk(PresentationNode $node,int $current,int &$nodes,int &$maxDepth): void
    {
        $nodes++;$maxDepth=max($maxDepth,$current);foreach($node->children as $child)$this->walk($child,$current+1,$nodes,$maxDepth);
    }

    /** @param list<float|int> $samples */
    private static function p95(array $samples): float
    {
        if($samples===[])return 0.0;$v=array_map('floatval',$samples);sort($v,SORT_NUMERIC);$idx=max(0,(int)ceil(count($v)*0.95)-1);return round($v[$idx],3);
    }
}

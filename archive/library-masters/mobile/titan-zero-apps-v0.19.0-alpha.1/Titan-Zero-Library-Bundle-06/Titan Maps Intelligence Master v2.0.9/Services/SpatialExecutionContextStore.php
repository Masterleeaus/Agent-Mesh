<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Services;
use App\Extensions\TitanMapsIntelligence\DTO\SpatialExecutionContext;
final class SpatialExecutionContextStore
{
    private ?SpatialExecutionContext $current=null;
    public function set(SpatialExecutionContext $context): void{$this->current=$context;}
    public function current(): ?SpatialExecutionContext{return $this->current;}
    public function clear(): void{$this->current=null;}
}

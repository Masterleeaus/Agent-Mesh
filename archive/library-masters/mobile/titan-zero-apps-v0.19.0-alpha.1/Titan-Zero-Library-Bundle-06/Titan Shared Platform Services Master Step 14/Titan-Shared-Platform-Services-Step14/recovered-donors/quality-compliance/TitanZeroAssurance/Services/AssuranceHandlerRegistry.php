<?php
declare(strict_types=1);
namespace Modules\TitanZeroAssurance\Services;
use Modules\TitanZeroAssurance\Contracts\AssuranceSignalHandler;
final class AssuranceHandlerRegistry implements \IteratorAggregate {private array $handlers=[];public function register(AssuranceSignalHandler $handler):void{$this->handlers[]=$handler;}public function getIterator():\Traversable{return new \ArrayIterator($this->handlers);}}

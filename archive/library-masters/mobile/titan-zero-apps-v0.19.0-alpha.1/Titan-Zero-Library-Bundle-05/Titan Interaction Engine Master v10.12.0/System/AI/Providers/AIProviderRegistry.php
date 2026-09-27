<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\AI\Providers;
use App\Extensions\InteractionEngine\System\Contracts\InteractionContext;
final class AIProviderRegistry{private array $providers=[];public function register(InteractionAIProviderInterface $p):void{$this->providers[$p->key()]=$p;}public function available(InteractionContext $c):array{$p=array_values(array_filter($this->providers,fn($v)=>$v->available($c)));usort($p,fn($a,$b)=>$b->priority()<=>$a->priority());return$p;}public function select(InteractionContext $c,array $preferred=[]):?InteractionAIProviderInterface{foreach($preferred as $key){$p=$this->providers[$key]??null;if($p&&$p->available($c))return$p;}return$this->available($c)[0]??null;}public function keys():array{return array_keys($this->providers);}}

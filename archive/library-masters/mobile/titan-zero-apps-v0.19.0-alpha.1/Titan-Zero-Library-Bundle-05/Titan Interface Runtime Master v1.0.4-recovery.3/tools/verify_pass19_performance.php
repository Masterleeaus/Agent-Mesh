<?php

declare(strict_types=1);
$root=dirname(__DIR__);
spl_autoload_register(static function(string$class)use($root):void{$p='App\\Extensions\\TitanInterfaceRuntime\\';if(!str_starts_with($class,$p))return;$f=$root.'/'.str_replace('\\','/',substr($class,strlen($p))).'.php';if(is_file($f))require_once$f;});
use App\Extensions\TitanInterfaceRuntime\System\Presentation\{PresentationNode,PresentationTree,ResponsiveHints};
use App\Extensions\TitanInterfaceRuntime\System\Performance\PresentationPerformanceGuard;
function perf19(bool$ok,string$m):void{if(!$ok)throw new RuntimeException($m);}
$children=[];for($i=0;$i<60;$i++)$children[]=new PresentationNode('text','row-'.$i,['text'=>'Row '.$i]);
$tree=new PresentationTree('command',new PresentationNode('stack','root',[], $children),ResponsiveHints::auto());
$samples=[];for($i=0;$i<250;$i++){ $start=hrtime(true);$tree->toCanonicalJson();$samples[]=(hrtime(true)-$start)/1_000_000; }
$guard=new PresentationPerformanceGuard(524288,2000,16,100.0);$report=$guard->inspect($tree,$samples);
perf19($report->withinBudget(),'Measured presentation serialization exceeded Pass 19 performance budget.');
perf19($report->p95Ms<100.0,'Measured p95 presentation latency exceeded 100ms.');
echo 'PASS 19 PERFORMANCE: measured p95_ms='.$report->p95Ms.' payload_bytes='.$report->payloadBytes.' nodes='.$report->nodeCount.' depth='.$report->maxDepth."\n";

<?php

declare(strict_types=1);
$root=dirname(__DIR__);
spl_autoload_register(static function(string$class)use($root):void{$p='App\\Extensions\\TitanInterfaceRuntime\\';if(!str_starts_with($class,$p))return;$f=$root.'/'.str_replace('\\','/',substr($class,strlen($p))).'.php';if(is_file($f))require_once$f;});
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\{AccessibilityAuditor,LocalizationPolicy,PresentationNode,PresentationTree,ResponsiveAuditor,ResponsiveHints};
use App\Extensions\TitanInterfaceRuntime\System\Performance\{PresentationCache,PresentationPerformanceGuard,PresentationQualityGate};
function q19(bool$ok,string$m):void{if(!$ok)throw new RuntimeException($m);}
$ctx=new InterfaceContext(4,9,'hub','crm');
$tree=new PresentationTree('hub',new PresentationNode('button','pay',['accessibility'=>['name'=>'Pay invoice','keyboard_operable'=>true,'focus_visible'=>true,'target_size_px'=>44]]),ResponsiveHints::required());
$gate=new PresentationQualityGate(new PresentationCache(8),new AccessibilityAuditor(),new ResponsiveAuditor(),new LocalizationPolicy(['en-AU','ar'],'en-AU'),new PresentationPerformanceGuard(65536,100,8,50));
$first=$gate->assess($ctx,'ar','invoice-1',$tree,[1,2,2,3,4,4,5,5,6,7]);
$second=$gate->assess($ctx,'ar','invoice-1',$tree,[1]);
q19($first->passes()&&!$first->cacheHit,'First quality-gated presentation must pass uncached.');
q19($second->cacheHit,'Second identical presentation must hit scoped cache.');
q19($first->localization->direction==='rtl','Arabic locale must project RTL direction.');
q19($first->performance->p95Ms===7.0,'p95 sample calculation is incorrect.');
q19($first->responsive->passes(),'Required responsive Hub tree must pass responsive audit.');
echo "PASS 19 QUALITY: WCAG target, localization/RTL, responsive policy, p95 budgets and scoped caching are active\n";

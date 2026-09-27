<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Runtime;
use App\Extensions\TitanVisualRuntime\System\Contracts\{VisualOfflineCachePlanner,VisualEnvironment};
final class DeterministicVisualOfflineCachePlanner implements VisualOfflineCachePlanner {
 public function plan(array $resources,VisualEnvironment $environment,?int $budgetBytes=null): array {
  $budget=$budgetBytes??52428800; if($budget<0) throw new \InvalidArgumentException('Invalid visual cache budget.');
  $candidates=[];
  foreach($resources as $r){
   if(!is_array($r)||empty($r['role'])) continue;
   $critical=(bool)($r['offlineCritical']??false); $size=max(0,(int)($r['bytes']??0));
   $cache=$critical || in_array($environment->connectivity,['offline','poor'],true);
   if(!$cache) continue;
   $candidates[]=['role'=>$r['role'],'uri'=>$r['offlineUri']??($r['uri']??null),'sha256'=>$r['sha256']??null,'bytes'=>$size,'critical'=>$critical,'reason'=>$critical?'offline-critical':'degraded-connectivity'];
  }
  usort($candidates,fn($a,$b)=>(($b['critical']<=>$a['critical'])) ?: strcmp((string)$a['role'],(string)$b['role']));
  $items=[];$bytes=0;$skipped=[];
  foreach($candidates as $c){
   if($bytes+$c['bytes']>$budget){$skipped[]=['role'=>$c['role'],'reason'=>'budget-exceeded'];continue;}
   unset($c['critical']);$items[]=$c;$bytes+=$c['bytes'];
  }
  return ['resources'=>$items,'skipped'=>$skipped,'estimatedBytes'=>$bytes,'budgetBytes'=>$budget,'deterministic'=>true,'business_meaning_unchanged'=>true];
 }
}

<?php
require_once __DIR__.'/../../System/Migration/CanonicalSurfaceResolver.php';
use App\Extensions\TitanBuilder\System\Migration\CanonicalSurfaceResolver;
$r=new CanonicalSurfaceResolver();
$cases=['zero'=>'zero','base'=>'zero','owner'=>'zero','command'=>'zero','bos'=>'zero','field'=>'go','worker'=>'go','customer'=>'hub','hub'=>'hub'];
foreach($cases as $in=>$want){$got=$r->resolve($in); if($got['surface']!==$want) throw new RuntimeException("$in != $want");}
$o=$r->resolve('onboarding'); if($o['surface']!=='zero'||$o['journey']!=='onboarding') throw new RuntimeException('onboarding boundary failed');
try{$r->resolve('chatbot'); throw new RuntimeException('unknown surface accepted');}catch(InvalidArgumentException $e){}
echo "PASS canonical surfaces zero/go/hub + onboarding journey + legacy aliases\n";

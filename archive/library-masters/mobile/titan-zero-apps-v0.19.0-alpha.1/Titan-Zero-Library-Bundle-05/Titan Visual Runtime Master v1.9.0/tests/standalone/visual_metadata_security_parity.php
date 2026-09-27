<?php
require_once __DIR__.'/../../System/Runtime/VisualMetadataGuard.php';
use App\Extensions\TitanVisualRuntime\System\Runtime\VisualMetadataGuard;
$g=new VisualMetadataGuard();
foreach(['permission','autonomy','risk','cost','privacy','capability','script','credentials'] as $key){
 try{$g->validate([$key=>'x']); throw new RuntimeException("accepted forbidden $key");}
 catch(InvalidArgumentException $e){}
}
$g->validate(['visualTreatment'=>'safe','densityRules'=>['mobile'=>'compact']]);
echo "VISUAL_SECURITY_PARITY: PASS\n";

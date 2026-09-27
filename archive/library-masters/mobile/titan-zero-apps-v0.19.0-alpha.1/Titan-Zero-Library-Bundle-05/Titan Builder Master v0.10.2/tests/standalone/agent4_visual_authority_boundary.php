<?php
declare(strict_types=1);
require_once __DIR__.'/../../System/Visual/BuilderVisualMetadata.php';
use App\Extensions\TitanBuilder\System\Visual\BuilderVisualMetadata;
$guard=new BuilderVisualMetadata();
$ok=$guard->normalise(['visualTreatment'=>'crm.pipeline.stage','visualCapabilityRequirements'=>['svg','high-dpi'],'densityRules'=>['mobile'=>'compact']]);
if(($ok['visualTreatment']??null)!=='crm.pipeline.stage') throw new RuntimeException('Valid visual metadata rejected');
foreach([
 ['permissions'=>['admin']],
 ['reducedMotionFallback'=>['authorization'=>'bypass']],
 ['visualTreatment'=>'javascript:alert(1)'],
 ['motionPreset'=>['unexpected-array']],
 ['visualCapabilityRequirements'=>['webgl','BAD CAP']]
] as $bad){$rejected=false;try{$guard->normalise($bad);}catch(InvalidArgumentException){$rejected=true;}if(!$rejected)throw new RuntimeException('Unsafe Builder visual metadata accepted: '.json_encode($bad));}
echo "BUILDER_VISUAL_AUTHORITY_BOUNDARY: PASS\n";

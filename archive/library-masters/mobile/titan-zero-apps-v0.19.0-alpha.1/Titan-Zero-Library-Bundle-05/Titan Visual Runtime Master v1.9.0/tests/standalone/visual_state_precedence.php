<?php
require_once __DIR__.'/../../System/Contracts/VisualStateTransitionPlanner.php';
require_once __DIR__.'/../../System/Runtime/DeterministicVisualStateTransitionPlanner.php';
require_once __DIR__.'/../../System/Contracts/VisualContributionResolver.php';
require_once __DIR__.'/../../System/Runtime/DeterministicVisualContributionResolver.php';
use App\Extensions\TitanVisualRuntime\System\Runtime\DeterministicVisualStateTransitionPlanner;
use App\Extensions\TitanVisualRuntime\System\Runtime\DeterministicVisualContributionResolver;
$t=new DeterministicVisualStateTransitionPlanner(); $a=$t->plan('loading','success',['reducedMotion'=>true]); if($a['motionPreset']!=='none'||$a['businessMeaningChanged']!==false)throw new RuntimeException('reduced motion failure');
$r=new DeterministicVisualContributionResolver(); $x=$r->resolve('crm.pipeline',[['slot'=>'crm.pipeline','provider'=>'crm','priority'=>10,'treatment'=>'base'],['slot'=>'crm.pipeline','provider'=>'nexus','priority'=>20,'treatment'=>'risk']]); if(($x['provider']??null)!=='nexus')throw new RuntimeException('precedence failure');
echo "VISUAL_STATE_PRECEDENCE: PASS\n";

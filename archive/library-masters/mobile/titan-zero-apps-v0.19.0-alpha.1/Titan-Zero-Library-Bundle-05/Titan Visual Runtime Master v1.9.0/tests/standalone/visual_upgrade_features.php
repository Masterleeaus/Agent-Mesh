<?php
require_once __DIR__.'/../../System/Contracts/VisualContributionVersionPolicy.php';
require_once __DIR__.'/../../System/Contracts/VisualResourceFreshnessPolicy.php';
require_once __DIR__.'/../../System/Contracts/VisualCapabilityDegradationPlanner.php';
require_once __DIR__.'/../../System/Runtime/SemanticVisualContributionVersionPolicy.php';
require_once __DIR__.'/../../System/Runtime/DefaultVisualResourceFreshnessPolicy.php';
require_once __DIR__.'/../../System/Runtime/DeterministicVisualCapabilityDegradationPlanner.php';

use App\Extensions\TitanVisualRuntime\System\Runtime\{
    SemanticVisualContributionVersionPolicy,
    DefaultVisualResourceFreshnessPolicy,
    DeterministicVisualCapabilityDegradationPlanner
};

$v=new SemanticVisualContributionVersionPolicy();
if($v->compare('1.2.0','1.1.0')<=0) throw new RuntimeException('version policy failure');

$f=new DefaultVisualResourceFreshnessPolicy();
$r=$f->evaluate(['fetchedAt'=>1000,'maxAgeSeconds'=>100],1050);
if(!$r['fresh']) throw new RuntimeException('freshness failure');

$d=new DeterministicVisualCapabilityDegradationPlanner();
$p=$d->plan(['webgl','canvas','static'],['canvas']);
if(($p['selected']??null)!=='canvas' || !$p['degraded']) throw new RuntimeException('degradation planner failure');

echo "VISUAL_UPGRADE_FEATURES: PASS\n";

<?php
require_once __DIR__.'/../../System/Contracts/VisualContributionRegistry.php';
require_once __DIR__.'/../../System/Contracts/VisualContributionSource.php';
require_once __DIR__.'/../../System/Contracts/VisualOfflineCachePlanner.php';
require_once __DIR__.'/../../System/Contracts/VisualEnvironment.php';
require_once __DIR__.'/../../System/Runtime/VisualMetadataGuard.php';
require_once __DIR__.'/../../System/Runtime/InMemoryVisualContributionRegistry.php';
require_once __DIR__.'/../../System/Runtime/DeterministicVisualOfflineCachePlanner.php';

use App\Extensions\TitanVisualRuntime\System\Runtime\{VisualMetadataGuard,InMemoryVisualContributionRegistry,DeterministicVisualOfflineCachePlanner};
use App\Extensions\TitanVisualRuntime\System\Contracts\VisualEnvironment;

$r=new InMemoryVisualContributionRegistry(new VisualMetadataGuard());

$r->register(['id'=>'crm.pipeline','provider'=>'crm','company_id'=>'company-a','surfaces'=>['zero'],'treatment'=>'a']);
$r->register(['id'=>'crm.pipeline','provider'=>'crm','company_id'=>'company-b','surfaces'=>['zero'],'treatment'=>'b']);

if(($r->resolve('crm.pipeline','zero','company-a')['treatment']??null)!=='a') throw new RuntimeException('company A isolation failure');
if(($r->resolve('crm.pipeline','zero','company-b')['treatment']??null)!=='b') throw new RuntimeException('company B isolation failure');
if($r->resolve('crm.pipeline','zero','company-c')!==null) throw new RuntimeException('cross-company leak');

// Legacy tenantId is compatibility input only and must normalize to company_id.
$r->register(['id'=>'legacy.visual','provider'=>'crm','tenantId'=>'company-a','surfaces'=>['zero'],'treatment'=>'legacy']);
$legacy=$r->resolve('legacy.visual','zero','company-a');
if(($legacy['company_id']??null)!=='company-a' || array_key_exists('tenantId',$legacy)) throw new RuntimeException('legacy tenantId not normalized to company_id');

try{
    $r->register(['id'=>'conflict.visual','provider'=>'crm','company_id'=>'company-a','tenantId'=>'company-b','surfaces'=>['zero'],'treatment'=>'x']);
    throw new RuntimeException('conflicting company and tenant boundary accepted');
}catch(InvalidArgumentException $e){}

$e=new VisualEnvironment(surface:'zero',deviceClass:'mobile',width:390,devicePixelRatio:3.0,connectivity:'offline');
$p=new DeterministicVisualOfflineCachePlanner();
$plan=$p->plan([
 ['role'=>'a','uri'=>'/a','offlineCritical'=>true,'bytes'=>100],
 ['role'=>'b','uri'=>'/b','offlineCritical'=>false,'bytes'=>100]
],$e,100);

if(count($plan['resources'])!==1 || ($plan['resources'][0]['role']??null)!=='a' || count($plan['skipped'])!==1) throw new RuntimeException('cache budget failure');

echo "VISUAL_COMPANY_ID_REGISTRY_BUDGET: PASS\n";

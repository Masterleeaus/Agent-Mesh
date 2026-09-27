<?php
require_once __DIR__.'/../../System/Contracts/VisualContributionRegistry.php';
require_once __DIR__.'/../../System/Contracts/VisualContributionSource.php';
require_once __DIR__.'/../../System/Runtime/VisualMetadataGuard.php';
require_once __DIR__.'/../../System/Runtime/InMemoryVisualContributionRegistry.php';

use App\Extensions\TitanVisualRuntime\System\Runtime\{VisualMetadataGuard,InMemoryVisualContributionRegistry};

$r=new InMemoryVisualContributionRegistry(new VisualMetadataGuard());
$r->register(['id'=>'crm.pipeline','provider'=>'crm','company_id'=>'company-a','surfaces'=>['zero'],'treatment'=>'a','version'=>'1.1.0']);
$r->register(['id'=>'crm.pipeline','provider'=>'crm','company_id'=>'company-a','surfaces'=>['zero'],'treatment'=>'b','version'=>'1.2.0']);

if(($r->resolve('crm.pipeline','zero','company-a')['treatment']??null)!=='b') throw new RuntimeException('upgrade replacement failed');

try{
    $r->register(['id'=>'crm.pipeline','provider'=>'crm','company_id'=>'company-a','surfaces'=>['zero'],'treatment'=>'old','version'=>'1.1.0']);
    throw new RuntimeException('downgrade accepted');
}catch(InvalidArgumentException $e){}

echo "VISUAL_CONTRIBUTION_VERSIONING: PASS\n";

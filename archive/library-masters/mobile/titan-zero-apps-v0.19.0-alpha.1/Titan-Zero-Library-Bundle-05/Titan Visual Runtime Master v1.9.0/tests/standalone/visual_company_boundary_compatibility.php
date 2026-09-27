<?php
require_once __DIR__.'/../../System/Contracts/VisualContributionRegistry.php';
require_once __DIR__.'/../../System/Contracts/VisualContributionSource.php';
require_once __DIR__.'/../../System/Runtime/VisualMetadataGuard.php';
require_once __DIR__.'/../../System/Runtime/InMemoryVisualContributionRegistry.php';
use App\Extensions\TitanVisualRuntime\System\Runtime\{VisualMetadataGuard,InMemoryVisualContributionRegistry};
$r=new InMemoryVisualContributionRegistry(new VisualMetadataGuard());
$r->register(['id'=>'x','provider'=>'crm','tenantId'=>'legacy-company','surfaces'=>['zero'],'treatment'=>'a']);
$c=$r->resolve('x','zero','legacy-company');
if(($c['company_id']??null)!=='legacy-company') throw new RuntimeException('legacy tenantId did not normalize to company_id');
if(array_key_exists('tenantId',$c)) throw new RuntimeException('legacy tenantId leaked into canonical record');
$failed=false;
try{$r->register(['id'=>'y','provider'=>'crm','company_id'=>'a','tenantId'=>'b','surfaces'=>['zero'],'treatment'=>'a']);}catch(InvalidArgumentException){$failed=true;}
if(!$failed) throw new RuntimeException('conflicting tenantId/company_id was not rejected');
echo "VISUAL_COMPANY_BOUNDARY_COMPATIBILITY: PASS\n";

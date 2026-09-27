<?php
require_once __DIR__.'/../../System/Contracts/VisualContributionRegistry.php';
require_once __DIR__.'/../../System/Contracts/VisualContributionSource.php';
require_once __DIR__.'/../../System/Contracts/VisualContributionSnapshot.php';
require_once __DIR__.'/../../System/Runtime/VisualMetadataGuard.php';
require_once __DIR__.'/../../System/Runtime/InMemoryVisualContributionRegistry.php';
require_once __DIR__.'/../../System/Runtime/DeterministicVisualContributionSnapshot.php';
require_once __DIR__.'/../../System/Release/VisualRuntimePackageManifestValidator.php';

use App\Extensions\TitanVisualRuntime\System\Runtime\{VisualMetadataGuard,InMemoryVisualContributionRegistry,DeterministicVisualContributionSnapshot};
use App\Extensions\TitanVisualRuntime\System\Release\VisualRuntimePackageManifestValidator;

$r=new InMemoryVisualContributionRegistry(new VisualMetadataGuard());
$r->register(['id'=>'signal.alert','provider'=>'signal','company_id'=>'company-a','surfaces'=>['zero'],'treatment'=>'pulse']);
$r->register(['id'=>'crm.pipeline','provider'=>'crm','company_id'=>'company-a','surfaces'=>['zero','hub'],'treatment'=>'stage']);

$s=new DeterministicVisualContributionSnapshot($r);
$a=$s->snapshot('company-a');
$b=$s->snapshot('company-a');

if($a['sha256']!==$b['sha256'] || !$a['deterministic']) throw new RuntimeException('snapshot nondeterministic');
if(($a['tenant_boundary']??null)!=='company_id') throw new RuntimeException('wrong tenant boundary');

$m=json_decode(file_get_contents(__DIR__.'/../../extension.json'),true,512,JSON_THROW_ON_ERROR);
if(!(new VisualRuntimePackageManifestValidator())->validate($m)['valid']) throw new RuntimeException('manifest invalid');

echo "VISUAL_SNAPSHOT_MANIFEST_COMPANY_ID: PASS\n";

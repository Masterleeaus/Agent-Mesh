<?php
require_once __DIR__.'/../../System/Contracts/ComponentRegistry.php';
require_once __DIR__.'/../../System/Contracts/SurfaceRegistry.php';
require_once __DIR__.'/../../System/Contracts/VisualRuntimeMetadataContract.php';
require_once __DIR__.'/../../System/Contracts/BuilderRuntimeHealth.php';
require_once __DIR__.'/../../System/Runtime/DefaultBuilderRuntimeHealth.php';
require_once __DIR__.'/../../System/Contracts/SuiteContractNegotiator.php';
use App\Extensions\TitanBuilder\System\Runtime\DefaultBuilderRuntimeHealth;
use App\Extensions\TitanBuilder\System\Contracts\SuiteContractNegotiator;
$h=(new DefaultBuilderRuntimeHealth())->report();
if(($h['status']??null)!=='healthy') throw new RuntimeException('Builder runtime health degraded');
if(($h['tenant_boundary']??null)!=='company_id') throw new RuntimeException('wrong tenant boundary');
$n=SuiteContractNegotiator::negotiate(['required'=>['ComponentRegistry','SurfaceRegistry']]);
if(!($n['compatible']??false)) throw new RuntimeException('live suite contract negotiation failed');
$bad=SuiteContractNegotiator::negotiate(['required'=>['ComponentRegistry','UnknownContract']]);
if(($bad['compatible']??true)!==false || !in_array('UnknownContract',$bad['missing']??[],true)) throw new RuntimeException('unknown contract did not fail closed');
echo "BUILDER_RUNTIME_HEALTH: PASS\n";

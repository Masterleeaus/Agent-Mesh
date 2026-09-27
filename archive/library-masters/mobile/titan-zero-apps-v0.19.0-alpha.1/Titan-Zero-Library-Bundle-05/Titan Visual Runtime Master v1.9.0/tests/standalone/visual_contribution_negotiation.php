<?php
declare(strict_types=1);
require_once __DIR__.'/../../System/Contracts/VisualEnvironment.php';
require_once __DIR__.'/../../System/Contracts/VisualPreferences.php';
require_once __DIR__.'/../../System/Contracts/VisualCapabilityRegistry.php';
require_once __DIR__.'/../../System/Contracts/VisualCapabilityNegotiator.php';
require_once __DIR__.'/../../System/Contracts/VisualFallbackPlanner.php';
require_once __DIR__.'/../../System/Contracts/VisualContributionSource.php';
require_once __DIR__.'/../../System/Contracts/VisualContributionRegistry.php';
require_once __DIR__.'/../../System/Runtime/VisualMetadataGuard.php';
require_once __DIR__.'/../../System/Runtime/DefaultVisualCapabilityRegistry.php';
require_once __DIR__.'/../../System/Runtime/DefaultVisualCapabilityNegotiator.php';
require_once __DIR__.'/../../System/Runtime/DeterministicVisualFallbackPlanner.php';
require_once __DIR__.'/../../System/Runtime/InMemoryVisualContributionRegistry.php';
use App\Extensions\TitanVisualRuntime\System\Contracts\{VisualEnvironment,VisualPreferences,VisualContributionSource};
use App\Extensions\TitanVisualRuntime\System\Runtime\{VisualMetadataGuard,DefaultVisualCapabilityRegistry,DefaultVisualCapabilityNegotiator,DeterministicVisualFallbackPlanner,InMemoryVisualContributionRegistry};
$env=new VisualEnvironment('zero','desktop',1440,2.0,false,true,false,'online');
$neg=(new DefaultVisualCapabilityNegotiator(new DefaultVisualCapabilityRegistry()))->negotiate(['webgl','canvas','canvas'],$env);
if($neg['available']!==['canvas'] || $neg['missing']!==['webgl'] || $neg['strategy']!=='fallback') throw new RuntimeException('Negotiation mismatch');
$fb=(new DeterministicVisualFallbackPlanner())->fallback([], $env, new VisualPreferences(), $neg);
if($fb['reason']!=='missing-capability' || !$fb['degraded']) throw new RuntimeException('Fallback mismatch');
$registry=new InMemoryVisualContributionRegistry(new VisualMetadataGuard());
$source=new class implements VisualContributionSource {
 public function providerId(): string{return 'crm';}
 public function visualContributions(): array{return [['id'=>'crm.pipeline.stage','surfaces'=>['zero','hub'],'treatment'=>'pipeline-stage']];}
};
$registry->registerSource($source);
if(($registry->resolve('crm.pipeline.stage','hub')['provider']??null)!=='crm') throw new RuntimeException('Source registration mismatch');
$collision=false;
try{$registry->register(['id'=>'crm.pipeline.stage','provider'=>'nexus','surfaces'=>['zero'],'treatment'=>'x']);}catch(InvalidArgumentException){$collision=true;}
if(!$collision) throw new RuntimeException('Cross-provider collision was not rejected');
$authority=false;
try{$registry->register(['id'=>'crm.bad','provider'=>'crm','surfaces'=>['zero'],'treatment'=>'x','permissions'=>['admin']]);}catch(InvalidArgumentException){$authority=true;}
if(!$authority) throw new RuntimeException('Authority metadata was not rejected');
echo "visual contribution negotiation: PASS\n";

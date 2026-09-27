<?php

declare(strict_types=1);

$root=dirname(__DIR__);
$files=[
'Exceptions/MapsIntelligenceException.php','Contracts/AuthorisedCompanyContext.php','Contracts/AuditRecorder.php',
'Contracts/SpatialRiskGateway.php','Contracts/SpatialAssuranceGateway.php','Contracts/SpatialAutonomyGateway.php','Contracts/SpatialCommandBusGateway.php','Contracts/SpatialSignalPublisher.php','Contracts/SpatialRewindRecorder.php',
'DTO/SpatialExecutionContext.php','DTO/SpatialDecisionReceipt.php','Services/SpatialCapabilityPolicyCatalog.php',
'Services/UnavailableSpatialRiskGateway.php','Services/UnavailableSpatialAssuranceGateway.php','Services/UnavailableSpatialAutonomyGateway.php','Services/UnavailableSpatialCommandBusGateway.php',
'Services/SpatialExecutionContextFactory.php','Services/GovernedSpatialCapabilityExecutor.php'];
foreach($files as $f){if(!is_file($root.'/'.$f)){fwrite(STDERR,"Missing {$f}\n");exit(1);}require_once $root.'/'.$f;}

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialSignalPublisher;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialRewindRecorder;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialRiskGateway;
use App\Extensions\TitanMapsIntelligence\DTO\SpatialExecutionContext;
use App\Extensions\TitanMapsIntelligence\DTO\SpatialDecisionReceipt;
use App\Extensions\TitanMapsIntelligence\Services\SpatialExecutionContextFactory;
use App\Extensions\TitanMapsIntelligence\Services\GovernedSpatialCapabilityExecutor;
use App\Extensions\TitanMapsIntelligence\Services\SpatialCapabilityPolicyCatalog;
use App\Extensions\TitanMapsIntelligence\Services\UnavailableSpatialRiskGateway;
use App\Extensions\TitanMapsIntelligence\Services\UnavailableSpatialAssuranceGateway;
use App\Extensions\TitanMapsIntelligence\Services\UnavailableSpatialAutonomyGateway;
use App\Extensions\TitanMapsIntelligence\Services\UnavailableSpatialCommandBusGateway;

$ctx=new class implements AuthorisedCompanyContext {
 public function companyId(): string{return 'company-a';}
 public function userId(): string{return 'user-1';}
 public function branchId(): ?string{return 'branch-1';}
 public function workspaceId(): ?string{return 'workspace-1';}
};
$factory=new SpatialExecutionContextFactory($ctx);
$input=['trace_id'=>'trace-x','correlation_id'=>'corr-x','causation_id'=>'cause-x','agent_id'=>'agent-x','conversation_id'=>'conv-x','execution_origin'=>'ai'];
$c=$factory->fromInput('route.estimate',$input);
if($c->companyId!=='company-a'||$c->traceId!=='trace-x'||$c->correlationId!=='corr-x'||$c->causationId!=='cause-x'||$c->origin!=='ai'){fwrite(STDERR,"Context propagation failed\n");exit(1);}
try{$factory->fromInput('route.estimate',$input+['company_id'=>'company-b']);fwrite(STDERR,"Tenant override was accepted\n");exit(1);}catch(Throwable $e){if(!str_contains($e->getMessage(),'tenant')){fwrite(STDERR,"Wrong tenant override error\n");exit(1);}}

$signals=new class implements SpatialSignalPublisher {public array $events=[];public function publish(string $type,SpatialExecutionContext $context,array $payload=[]): ?string{$this->events[]=[$type,$context,$payload];return 'sig-'.count($this->events);}};
$rewind=new class implements SpatialRewindRecorder {public array $receipts=[];public function record(SpatialDecisionReceipt $r): ?string{$this->receipts[]=$r;return 'rew-'.count($this->receipts);}};
$executor=new GovernedSpatialCapabilityExecutor(new SpatialCapabilityPolicyCatalog(),new UnavailableSpatialRiskGateway(),new UnavailableSpatialAssuranceGateway(),new UnavailableSpatialAutonomyGateway(),new UnavailableSpatialCommandBusGateway(),$signals,$rewind,$factory);
$ran=false;$result=$executor->execute('route.estimate',$input,function()use(&$ran){$ran=true;return ['route'=>'ok'];});
if(!$ran||($result['ok']??false)!==true||($result['data']['route']??null)!=='ok'){fwrite(STDERR,"Read capability did not execute\n");exit(1);}
$r=$result['governance_receipt']??[];if(($r['trace_id']??null)!=='trace-x'||($r['company_id']??null)!=='company-a'||($r['status']??null)!=='completed'){fwrite(STDERR,"Execution receipt missing trace/tenant/status\n");exit(1);}
if(count($signals->events)!==1||$signals->events[0][0]!=='maps.capability.executed'){fwrite(STDERR,"Execution signal missing\n");exit(1);}

$offline=$executor->execute('route.estimate',['execution_origin'=>'offline_sync'],fn()=>['bad'=>'should-not-run']);
if(($offline['ok']??true)!==false||($offline['error']['code']??null)!=='MAPS_OFFLINE_BLOCKED'){fwrite(STDERR,"Offline blocked route policy was not enforced\n");exit(1);}

$denyRisk=new class implements SpatialRiskGateway {public function evaluate(SpatialExecutionContext $c,array $p,array $i,array $e=[]): array{return ['available'=>true,'allowed'=>false,'reference'=>'risk-1','reason_codes'=>['RISK_DENIED']];}};
$denying=new GovernedSpatialCapabilityExecutor(new SpatialCapabilityPolicyCatalog(),$denyRisk,new UnavailableSpatialAssuranceGateway(),new UnavailableSpatialAutonomyGateway(),new UnavailableSpatialCommandBusGateway(),$signals,$rewind,$factory);
$denied=$denying->execute('titan-maps-intelligence.territory.manage',$input,fn()=>['bad'=>'should-not-run']);
if(($denied['ok']??true)!==false||($denied['error']['code']??null)!=='MAPS_GOVERNANCE_DENIED'){fwrite(STDERR,"Risk denial was not enforced\n");exit(1);}

echo "Governed spatial execution runtime: PASS\n";

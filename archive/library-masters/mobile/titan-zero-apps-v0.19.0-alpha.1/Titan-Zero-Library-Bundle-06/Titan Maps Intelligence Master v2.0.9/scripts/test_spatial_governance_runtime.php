<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$files = [
    'Contracts/AuditRecorder.php',
    'Contracts/SpatialRiskGateway.php','Contracts/SpatialAssuranceGateway.php','Contracts/SpatialAutonomyGateway.php','Contracts/SpatialCommandBusGateway.php','Contracts/SpatialSignalPublisher.php','Contracts/SpatialRewindRecorder.php','Contracts/SpatialKnowledgeGateway.php',
    'DTO/SpatialExecutionContext.php','DTO/SpatialDecisionReceipt.php',
    'Services/UnavailableSpatialRiskGateway.php','Services/UnavailableSpatialAssuranceGateway.php','Services/UnavailableSpatialAutonomyGateway.php','Services/UnavailableSpatialCommandBusGateway.php','Services/UnavailableSpatialKnowledgeGateway.php','Services/LocalSpatialSignalPublisher.php','Services/LocalSpatialRewindRecorder.php',
];
foreach ($files as $file) {
    if (!is_file($root.'/'.$file)) { fwrite(STDERR,"Missing {$file}\n"); exit(1); }
    require_once $root.'/'.$file;
}

use App\Extensions\TitanMapsIntelligence\Contracts\AuditRecorder;
use App\Extensions\TitanMapsIntelligence\DTO\SpatialDecisionReceipt;
use App\Extensions\TitanMapsIntelligence\DTO\SpatialExecutionContext;
use App\Extensions\TitanMapsIntelligence\Services\UnavailableSpatialRiskGateway;
use App\Extensions\TitanMapsIntelligence\Services\UnavailableSpatialAssuranceGateway;
use App\Extensions\TitanMapsIntelligence\Services\UnavailableSpatialAutonomyGateway;
use App\Extensions\TitanMapsIntelligence\Services\UnavailableSpatialCommandBusGateway;
use App\Extensions\TitanMapsIntelligence\Services\UnavailableSpatialKnowledgeGateway;
use App\Extensions\TitanMapsIntelligence\Services\LocalSpatialSignalPublisher;
use App\Extensions\TitanMapsIntelligence\Services\LocalSpatialRewindRecorder;

$context = new SpatialExecutionContext('trace-1','corr-1','cause-1','company-a','user-1','agent-1','conv-1','route.estimate','ai');
$policy = ['risk_profile'=>'moderate'];
$risk = (new UnavailableSpatialRiskGateway())->evaluate($context,$policy,[]);
$assurance = (new UnavailableSpatialAssuranceGateway())->evaluate($context,$policy,[]);
$autonomy = (new UnavailableSpatialAutonomyGateway())->decide($context,$policy,[]);
foreach ([$risk,$assurance,$autonomy] as $result) {
    if (($result['available'] ?? true) !== false) { fwrite(STDERR,"Unavailable governance adapter claimed availability\n"); exit(1); }
}
$bus = new UnavailableSpatialCommandBusGateway();
if ($bus->available()) { fwrite(STDERR,"Unavailable Command Bus claimed availability\n"); exit(1); }
$cmd = $bus->execute($context,'crm.job.assign',[], 'idem-1');
if (($cmd['ok'] ?? true) !== false || ($cmd['error']['code'] ?? null) !== 'MAPS_COMMAND_BUS_UNAVAILABLE') { fwrite(STDERR,"Command Bus fallback did not fail closed\n"); exit(1); }
$knowledge = (new UnavailableSpatialKnowledgeGateway())->resolveJurisdiction($context,['latitude'=>-37.8,'longitude'=>145.0]);
if (($knowledge['available'] ?? true) !== false || ($knowledge['references'] ?? ['x']) !== []) { fwrite(STDERR,"Knowledge fallback fabricated references\n"); exit(1); }

$audit = new class implements AuditRecorder { public array $records=[]; public function record(array $record): void { $this->records[]=$record; } };
$signal = new LocalSpatialSignalPublisher($audit);
$id = $signal->publish('maps.capability.executed',$context,['ok'=>true]);
if (!is_string($id) || count($audit->records)!==1 || ($audit->records[0]['trace_id']??null)!=='trace-1') { fwrite(STDERR,"Local signal fallback did not preserve trace\n"); exit(1); }
$rewind = new LocalSpatialRewindRecorder($audit);
$receipt = new SpatialDecisionReceipt('r1','trace-1','corr-1','cause-1','company-a','route.estimate','completed');
$rewindId = $rewind->record($receipt);
if (!is_string($rewindId) || count($audit->records)!==2) { fwrite(STDERR,"Local rewind fallback failed\n"); exit(1); }

echo "Spatial governance runtime: PASS\n";

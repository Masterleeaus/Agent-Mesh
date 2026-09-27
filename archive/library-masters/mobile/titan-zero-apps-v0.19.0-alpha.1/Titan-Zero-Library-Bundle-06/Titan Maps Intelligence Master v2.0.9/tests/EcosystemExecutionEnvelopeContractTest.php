<?php
declare(strict_types=1);
$root = dirname(__DIR__);
$contract = json_decode((string) file_get_contents($root . '/resources/contracts/ecosystem-execution-envelope.v1.json'), true, 512, JSON_THROW_ON_ERROR);
$ecosystem = json_decode((string) file_get_contents($root . '/ecosystem-integration.json'), true, 512, JSON_THROW_ON_ERROR);
require_once $root . '/System/Integration/EcosystemExecutionEnvelope.php';
$klass = 'App\Extensions\TitanMapsIntelligence\System\Integration\EcosystemExecutionEnvelope';
$payload = [
 'envelope_id'=>'env-1','company_id'=>7,'source_extension'=>'crm','target_extension'=>'titan-field','work_type'=>'field.dispatch.review',
 'correlation_id'=>'corr-1','causation_id'=>'cause-1','idempotency_key'=>'idem-1',
 'provider'=>['extension'=>'titan-field','capability'=>'crm.dispatch'],
 'authority'=>['decision'=>'approved','owner'=>'titan-autonomy'],'status'=>'accepted','occurred_at'=>'2026-08-22T09:00:00+10:00','evidence_refs'=>['evidence:1']
];
$env = $klass::fromArray($payload);
$checks = [
 ($contract['tenancy']['required_key'] ?? null)==='company_id',
 ($contract['idempotency']['required'] ?? false)===true,
 ($contract['receipt']['required'] ?? false)===true,
 ($contract['workforce']['extension_must_not_create_roles'] ?? false)===true,
 ($ecosystem['execution']['envelope_contract'] ?? null)==='resources/contracts/ecosystem-execution-envelope.v1.json',
 ($ecosystem['execution']['cross_extension_idempotency_scope'] ?? [])===['company_id','target_extension','work_type','idempotency_key'],
 $env->mayMutate()===true,
 $env->idempotencyScope()==='7:titan-field:field.dispatch.review:idem-1',
];
foreach ($checks as $ok) { if (!$ok) { fwrite(STDERR, "ecosystem execution envelope contract failed\n"); exit(1); } }
try { $bad=$payload; $bad['authority']=['decision'=>'invented']; $klass::fromArray($bad); fwrite(STDERR,"invalid authority accepted\n"); exit(1); } catch (InvalidArgumentException $e) {}
echo 'ECOSYSTEM_EXECUTION_ENVELOPE: PASS (' . count($checks) . '/' . count($checks) . ")\n";

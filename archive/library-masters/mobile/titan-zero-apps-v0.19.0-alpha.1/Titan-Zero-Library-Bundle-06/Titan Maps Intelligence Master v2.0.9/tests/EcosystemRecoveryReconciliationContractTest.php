<?php
declare(strict_types=1);
$root = dirname(__DIR__);
$contract = json_decode((string) file_get_contents($root . '/resources/contracts/ecosystem-recovery-reconciliation.v1.json'), true, 512, JSON_THROW_ON_ERROR);
$ecosystem = json_decode((string) file_get_contents($root . '/ecosystem-integration.json'), true, 512, JSON_THROW_ON_ERROR);
require_once $root . '/System/Integration/EcosystemRecoveryReconciliationPolicy.php';
$klass = 'App\Extensions\TitanMapsIntelligence\System\Integration\EcosystemRecoveryReconciliationPolicy';
$checks = [
 ($contract['tenancy']['required_key'] ?? null) === 'company_id',
 ($contract['recovery']['preserve_idempotency_key'] ?? false) === true,
 ($contract['recovery']['authority_must_be_rechecked'] ?? false) === true,
 ($contract['reconciliation']['partial_success_never_treated_as_complete'] ?? false) === true,
 ($contract['stuck_work']['stale_worker_cannot_commit'] ?? false) === true,
 ($contract['workforce']['outcome_verification_required'] ?? false) === true,
 ($ecosystem['recovery']['contract'] ?? null) === 'resources/contracts/ecosystem-recovery-reconciliation.v1.json',
 $klass::nextAfterFailure('timeout', 1) === 'retry_wait',
 $klass::nextAfterFailure('timeout', 5) === 'dead_letter',
 $klass::nextAfterFailure('authorization_denied', 1) === 'attention_required',
 $klass::reconciliationState(true, true, true) === 'recovered',
 $klass::reconciliationState(true, false, true) === 'reconciling',
 $klass::reconciliationState(false, false, false) === 'attention_required',
 $klass::canCommitRecoveredWork(true, 4, 4) === true,
 $klass::canCommitRecoveredWork(true, 3, 4) === false,
];
foreach ($checks as $ok) { if (!$ok) { fwrite(STDERR, "ecosystem recovery/reconciliation contract failed\n"); exit(1); } }
try { $klass::assertState('invented'); fwrite(STDERR, "invalid recovery state accepted\n"); exit(1); } catch (InvalidArgumentException $e) {}
echo 'ECOSYSTEM_RECOVERY_RECONCILIATION: PASS (' . count($checks) . '/' . count($checks) . ")\n";

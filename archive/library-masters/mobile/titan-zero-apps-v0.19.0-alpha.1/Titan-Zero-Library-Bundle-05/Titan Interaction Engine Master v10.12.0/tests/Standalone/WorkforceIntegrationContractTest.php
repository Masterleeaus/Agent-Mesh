<?php

declare(strict_types=1);

require_once __DIR__ . '/../../System/Workforce/WorkforceIntegrationContract.php';

use App\Extensions\InteractionEngine\System\Workforce\WorkforceIntegrationContract;

$manifest = WorkforceIntegrationContract::definition();
$fail = static function (string $message): never { fwrite(STDERR, "FAIL: {$message}\n"); exit(1); };

(($manifest['provider']['contract_version'] ?? null) === '1.1') || $fail('Workforce contract version 1.1 missing');
(($manifest['tenancy']['key'] ?? null) === 'company_id') || $fail('canonical company_id tenancy missing');
(($manifest['tenancy']['fail_closed'] ?? false) === true) || $fail('tenancy must fail closed');
(($manifest['governance']['availability_is_not_authority'] ?? false) === true) || $fail('availability must be authority-neutral');
(($manifest['ownership']['extension_must_not_own'] ?? []) !== []) || $fail('forbidden Workforce ownership missing');
count($manifest['tools'] ?? []) === 5 || $fail('read tools were not published');
count($manifest['data_sources'] ?? []) === 5 || $fail('data sources were not published');
foreach (($manifest['tools'] ?? []) as $tool) { (($tool['mutating'] ?? true) === false) || $fail('read tool marked mutating'); (($tool['provider'] ?? '') !== '') || $fail('tool provider provenance missing'); }
foreach (($manifest['data_sources'] ?? []) as $source) { (($source['mutation_forbidden'] ?? false) === true) || $fail('data source permits mutation'); (($source['authority_neutral'] ?? false) === true) || $fail('data source must be authority-neutral'); }
foreach (($manifest['reads'] ?? []) as $read) { (($read['mutating'] ?? true) === false) || $fail('read surface marked mutating'); }
foreach (($manifest['commands'] ?? []) as $command) {
    (($command['mutating'] ?? false) === true) || $fail('command must be mutating');
    (($command['installed_does_not_imply_authority'] ?? false) === true) || $fail('installed must not imply authority');
    (($command['provider_pin_required'] ?? false) === true) || $fail('provider pin not required');
    (($command['idempotency_required'] ?? false) === true) || $fail('idempotency not required');
    (($command['receipt_required'] ?? false) === true) || $fail('receipt not required');
    (($command['evidence_required'] ?? false) === true) || $fail('evidence not required');
    foreach (['company_id','trace_id','correlation_id','causation_id','root_causation_id','idempotency_key'] as $key) { in_array($key, $command['required_context'] ?? [], true) || $fail("missing execution context {$key}"); }
}
$states = $manifest['availability']['states'] ?? [];
foreach (['available','degraded','unavailable','missing_provider','blocked','policy_disabled'] as $state) { in_array($state, $states, true) || $fail("missing availability state {$state}"); }

$context = [
    'company_id' => '1',
    'trace_id' => 'trace-pass5',
    'correlation_id' => 'corr-pass5',
    'causation_id' => 'cause-pass5',
    'root_causation_id' => 'root-pass5',
    'idempotency_key' => 'idem-pass5',
];
$executable = WorkforceIntegrationContract::executableCommand('interaction.work.prepare', $context);
(($executable['id'] ?? null) === 'interaction.work.prepare') || $fail('executable command resolution failed');
try { WorkforceIntegrationContract::executableCommand('interaction.work.prepare', array_diff_key($context, ['idempotency_key' => true])); $fail('command accepted without idempotency key'); } catch (InvalidArgumentException) {}
try { WorkforceIntegrationContract::executableCommand('missing.command', $context); $fail('unknown command accepted'); } catch (InvalidArgumentException) {}
WorkforceIntegrationContract::assertCompanyId(1) === '1' || $fail('company_id normalization failed');
try { WorkforceIntegrationContract::assertCompanyId(''); $fail('empty company_id accepted'); } catch (InvalidArgumentException) {}
try { WorkforceIntegrationContract::assertCompanyId('abc'); $fail('non-numeric company_id accepted'); } catch (InvalidArgumentException) {}

echo "PASS: Workforce integration 1.1 (5 tools, 5 data sources, 3 executable commands)\n";

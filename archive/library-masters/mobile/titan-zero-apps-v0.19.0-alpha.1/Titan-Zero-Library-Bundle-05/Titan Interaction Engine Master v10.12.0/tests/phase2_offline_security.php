<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$failures = [];
$check = static function (bool $condition, string $message) use (&$failures): void {
    if (!$condition) {
        $failures[] = $message;
    }
};

$controller = (string) file_get_contents($root . '/System/Http/Controllers/OfflineCommandController.php');
$check(str_contains($controller, 'CompanyContextResolverContract'), 'Offline replay does not use the trusted tenant resolver.');
$check(str_contains($controller, '$trustedTenant'), 'Offline replay does not distinguish trusted company identity from device metadata.');
$check(str_contains($controller, "'interaction:offline-command:' . \$trustedTenant . ':'"), 'Offline replay idempotency is not company-scoped.');
$check(!str_contains($controller, "data_get(\$validated, 'metadata.delegated_scopes'"), 'Delegated scopes are still trusted from device metadata.');
$check(!str_contains($controller, "data_get(\$validated, 'metadata.authenticated_at'"), 'Authentication freshness is still trusted from device metadata.');
$check(str_contains($controller, "'company_id' => \$trustedTenant"), 'Trusted company_id is not written into replay execution context.');
$check(!str_contains($controller, "'message' => \$error->getMessage()"), 'Offline replay must not expose raw execution exception details to clients.');

$bus = (string) file_get_contents($root . '/System/Command/CommandBus.php');
$check(!str_contains($bus, "?? 'default'"), 'CommandBus still falls back to a synthetic default tenant.');
$check(str_contains($bus, 'Trusted company_id context is required'), 'CommandBus does not fail closed when company context is missing.');

$wizardContext = (string) file_get_contents($root . '/System/Wizard/Context/WizardExecutionContextFactory.php');
$check(!str_contains($wizardContext, "\$companyId = \$input['company_id']"), 'Wizard context still accepts request company identity when authenticated tenant is absent.');

$runtime = (string) file_get_contents($root . '/System/Runtime/InteractionRuntime.php');
$check(str_contains($runtime, "'company_id' => \$state['company_id']"), 'Online interaction dispatch does not propagate trusted company context.');

$localController = (string) file_get_contents($root . '/System/Http/Controllers/LocalIntelligenceController.php');
$check(str_contains($localController, 'CompanyContextResolverContract'), 'Local intelligence endpoint bypasses the trusted tenant resolver.');

if ($failures !== []) {
    fwrite(STDERR, "Phase 2 offline security checks failed:\n - " . implode("\n - ", $failures) . "\n");
    exit(1);
}

echo "Phase 2 offline security checks passed\n";

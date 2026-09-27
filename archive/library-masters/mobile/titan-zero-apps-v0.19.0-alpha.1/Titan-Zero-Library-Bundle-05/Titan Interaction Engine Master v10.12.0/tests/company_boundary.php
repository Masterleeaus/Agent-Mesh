<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$contract = $root . '/System/Company/CompanyContextResolverContract.php';
$resolverFile = $root . '/System/Company/AuthenticatedUserCompanyContextResolver.php';
if (!is_file($contract) || !is_file($resolverFile)) {
    fwrite(STDERR, "Company resolver contract/implementation missing\n");
    exit(1);
}
require_once $contract;
require_once $resolverFile;

$resolver = new App\Extensions\InteractionEngine\System\Company\AuthenticatedUserCompanyContextResolver();
if (!method_exists($resolver, 'companyId') || $resolver->companyId(['id' => 7, 'company_id' => 'company-a']) !== 'company-a') {
    throw new RuntimeException('Resolver primary API must expose company_id as companyId');
}
if ($resolver->companyId(['id' => 7, 'company_id' => 'company-a']) !== 'company-a') {
    throw new RuntimeException('Resolver did not use authenticated company_id');
}
try {
    $resolver->companyId((object) ['id' => 7, 'team_id' => 'team-a']);
    throw new RuntimeException('Resolver must not treat team_id as the company boundary');
} catch (RuntimeException $e) {
    if (!str_contains($e->getMessage(), 'Unable to resolve')) {
        throw $e;
    }
}
$request = new class { public function user(): array { return ['id' => 7, 'company_id' => 'company-request']; } };
if (!method_exists($resolver, 'companyIdFromRequest') || $resolver->companyIdFromRequest($request) !== 'company-request') {
    throw new RuntimeException('Resolver must resolve company_id from the authenticated request user');
}
try {
    $resolver->companyId(['id' => 7]);
    throw new RuntimeException('Resolver must fail closed when company context is unavailable');
} catch (RuntimeException $e) {
    if (!str_contains($e->getMessage(), 'Unable to resolve')) {
        throw $e;
    }
}

echo "Phase 1 company-boundary checks passed\n";

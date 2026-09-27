<?php
$root = dirname(__DIR__);
$provider = file_get_contents($root.'/System/TitanMapsIntelligenceServiceProvider.php');
$context = file_get_contents($root.'/Services/RequestAuthorisedCompanyContext.php');
$middlewarePath = $root.'/Http/Middleware/ResolveMapsCompanyContext.php';
$reject = file_get_contents($root.'/Http/Middleware/RejectClientCompanyOverride.php');
$errors = [];

// New Maps routes must use the extension-owned alias, never the legacy host-global name.
foreach ([
    "['web', 'auth', 'titan.maps.reject-company-override', 'titan.company'",
    "['api', 'auth:sanctum', 'titan.maps.reject-company-override', 'titan.company'",
] as $forbiddenRouteStack) {
    if (str_contains($provider, $forbiddenRouteStack)) {
        $errors[] = 'new Maps route groups still depend on legacy titan.company middleware';
    }
}

if (!str_contains($provider, "aliasMiddleware('titan.maps.company'")) $errors[] = 'provider does not register extension-owned titan.maps.company alias';
if (!str_contains($provider, "'titan.maps.company'")) $errors[] = 'user/api route groups do not use extension-owned company middleware';

// Upgrade compatibility: an old Laravel route cache can still contain the literal
// titan.company alias from beta.1. Register a fallback only when the host does not
// already own that alias, so stale cached routes resolve without hijacking host behavior.
if (!str_contains($provider, "getMiddleware()")) $errors[] = 'provider does not inspect existing host middleware aliases before legacy fallback registration';
if (!str_contains($provider, "['titan.company']")) $errors[] = 'provider does not provide stale-route-cache compatibility for titan.company';
if (!str_contains($provider, "aliasMiddleware('titan.company', ResolveMapsCompanyContext::class)")) $errors[] = 'provider does not register conditional legacy company middleware fallback';

if (!is_file($middlewarePath)) $errors[] = 'ResolveMapsCompanyContext middleware missing';
foreach (["company_id", "active_company_id"] as $needle) {
    if (!str_contains($context, $needle)) $errors[] = "company context does not resolve {$needle}";
}
if (!str_contains($context, 'crm_company_context')) $errors[] = 'company context does not consume trusted CRM request context when available';
if (!str_contains($reject, "'company_id'")) $errors[] = 'client company_id override is not rejected';
if ($errors) { foreach ($errors as $e) fwrite(STDERR, "FAIL: {$e}\n"); exit(1); }
echo "Host company middleware compatibility PASS\n";

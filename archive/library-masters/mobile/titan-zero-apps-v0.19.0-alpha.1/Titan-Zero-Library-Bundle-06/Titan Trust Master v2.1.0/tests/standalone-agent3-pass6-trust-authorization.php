<?php

declare(strict_types=1);

require_once __DIR__ . '/../System/Security/TrustAuthorization.php';

use App\Extensions\TitanTrust\System\Security\TrustAuthorization;

final class GenericAuthenticatedActor {}
final class AdminActor { public function isAdmin(): bool { return true; } }
final class SuperAdminActor { public function isSuperAdmin(): bool { return true; } }
final class ExplicitGrantActor {
    public function can(string $permission): bool { return $permission === TrustAuthorization::INCIDENT_RESOLVE; }
}

$failures = [];
$assert = static function (bool $condition, string $message) use (&$failures): void {
    if (! $condition) $failures[] = $message;
};

$assert(! TrustAuthorization::allows(new GenericAuthenticatedActor(), TrustAuthorization::COMPLIANCE_OVERRIDE), 'Generic authenticated actor must not override compliance.');
$assert(! TrustAuthorization::allows(new GenericAuthenticatedActor(), TrustAuthorization::INCIDENT_RESOLVE), 'Generic authenticated actor must not resolve incidents.');
$assert(TrustAuthorization::allows(new AdminActor(), TrustAuthorization::RULE_MANAGE), 'Delegated admin compatibility must remain operational.');
$assert(TrustAuthorization::allows(new SuperAdminActor(), TrustAuthorization::COMPLIANCE_OVERRIDE), 'Super admin authority must remain operational.');
$assert(TrustAuthorization::allows(new ExplicitGrantActor(), TrustAuthorization::INCIDENT_RESOLVE), 'Explicit host permission must be honored.');

$manager = file_get_contents(__DIR__ . '/../Http/Controllers/ManagerReviewController.php') ?: '';
$legacyIncident = file_get_contents(__DIR__ . '/../Http/Controllers/IncidentController.php') ?: '';
$systemIncident = file_get_contents(__DIR__ . '/../System/Http/Controllers/IncidentController.php') ?: '';
$rules = file_get_contents(__DIR__ . '/../System/Http/Controllers/RulesController.php') ?: '';

$assert(str_contains($manager, 'TrustAuthorization::COMPLIANCE_OVERRIDE'), 'Manager compliance override must assert explicit Titan Trust authority.');
$assert(str_contains($legacyIncident, 'TrustAuthorization::INCIDENT_RESOLVE'), 'Legacy incident resolver must assert explicit Titan Trust authority.');
$assert(str_contains($systemIncident, 'TrustAuthorization::INCIDENT_RESOLVE'), 'Canonical incident resolver must assert explicit Titan Trust authority.');
$assert(substr_count($rules, 'TrustAuthorization::RULE_MANAGE') >= 6, 'Rule-management endpoints must enforce rule management authority.');
$assert(str_contains($systemIncident, 'public function show(Request $request, int $id)'), 'Incident show route must receive Request before tenant resolution.');
$assert(str_contains($rules, 'public function index(Request $request)'), 'Rules index must receive Request before tenant resolution.');
$assert(str_contains($rules, 'public function edit(Request $request, int $id)'), 'Rules edit must receive Request before tenant resolution.');
$assert(str_contains($rules, 'public function destroy(Request $request, int $id)'), 'Rules destroy must receive Request before tenant resolution.');

if ($failures !== []) {
    fwrite(STDERR, "Agent 3 Pass 6 TitanTrust authorization regression FAILED\n - " . implode("\n - ", $failures) . "\n");
    exit(1);
}

echo "Agent 3 Pass 6 TitanTrust authorization regression passed\n";

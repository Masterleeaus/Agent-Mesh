<?php
declare(strict_types=1);

require_once __DIR__ . '/../System/Integration/EcosystemOperationalHealthPolicy.php';

use App\Extensions\TitanMapsIntelligence\System\Integration\EcosystemOperationalHealthPolicy as Policy;

$checks = 0;
$assert = static function (bool $condition, string $message) use (&$checks): void {
    $checks++;
    if (!$condition) { fwrite(STDERR, "FAIL: {$message}\n"); exit(1); }
};

$assert(Policy::routeDecision('active', false, false) === 'primary', 'active provider uses primary');
$assert(Policy::routeDecision('degraded', true, true) === 'fallback', 'degraded provider can use governed fallback');
$assert(Policy::routeDecision('missing', true, true) === 'fallback', 'missing provider can use governed fallback');
$assert(Policy::routeDecision('quarantined', true, true) === 'attention_required', 'quarantined provider never auto-routes');
$assert(Policy::routeDecision('degraded', true, false) === 'attention_required', 'policy can disable fallback');
$assert(Policy::ageingSeverity(30, 60) === 'info', 'pre-SLA work is informational');
$assert(Policy::ageingSeverity(60, 60) === 'warning', 'SLA breach is warning');
$assert(Policy::ageingSeverity(120, 60) === 'critical', '2x SLA is critical');
$assert(Policy::exceptionPriority('critical', true, true) === 100, 'critical blocked risky work caps at 100');
$assert(Policy::exceptionPriority('warning', false, false) === 40, 'warning base priority');
$assert(Policy::outcomeAssured(true, true, true, true), 'all assurance gates complete');
$assert(!Policy::outcomeAssured(true, true, false, true), 'missing evidence blocks assurance');
$assert(!Policy::outcomeAssured(true, false, true, true), 'domain mismatch blocks assurance');
$assert(!Policy::outcomeAssured(true, true, true, false), 'revoked authority blocks assurance');

echo "OPERATIONAL_HEALTH_CONTRACT: PASS {$checks}/{$checks}\n";

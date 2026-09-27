<?php
declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\System\Integration;

use InvalidArgumentException;

final class EcosystemOperationalHealthPolicy
{
    private const HEALTH = ['active','degraded','missing','quarantined'];
    private const SEVERITY = ['info','warning','critical'];

    public static function assertHealth(string $state): void
    {
        if (!in_array($state, self::HEALTH, true)) {
            throw new InvalidArgumentException('Invalid provider health state.');
        }
    }

    public static function routeDecision(string $providerHealth, bool $fallbackEligible, bool $policyAllowsFallback): string
    {
        self::assertHealth($providerHealth);
        if ($providerHealth === 'active') { return 'primary'; }
        if ($providerHealth === 'degraded' && $fallbackEligible && $policyAllowsFallback) { return 'fallback'; }
        if ($providerHealth === 'missing' && $fallbackEligible && $policyAllowsFallback) { return 'fallback'; }
        return 'attention_required';
    }

    public static function ageingSeverity(int $ageSeconds, int $slaSeconds): string
    {
        if ($ageSeconds < 0 || $slaSeconds < 1) {
            throw new InvalidArgumentException('Age and SLA must be valid.');
        }
        if ($ageSeconds >= $slaSeconds * 2) { return 'critical'; }
        if ($ageSeconds >= $slaSeconds) { return 'warning'; }
        return 'info';
    }

    public static function exceptionPriority(string $severity, bool $customerBlocked, bool $safetyOrComplianceRisk): int
    {
        if (!in_array($severity, self::SEVERITY, true)) {
            throw new InvalidArgumentException('Invalid severity.');
        }
        $score = ['info' => 10, 'warning' => 40, 'critical' => 70][$severity];
        if ($customerBlocked) { $score += 15; }
        if ($safetyOrComplianceRisk) { $score += 15; }
        return min(100, $score);
    }

    public static function outcomeAssured(bool $receiptVerified, bool $domainStateVerified, bool $evidenceComplete, bool $authorityStillValid): bool
    {
        return $receiptVerified && $domainStateVerified && $evidenceComplete && $authorityStillValid;
    }
}

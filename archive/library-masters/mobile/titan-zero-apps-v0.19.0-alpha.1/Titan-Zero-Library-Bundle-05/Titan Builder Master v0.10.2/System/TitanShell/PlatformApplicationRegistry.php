<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\TitanShell;

use InvalidArgumentException;

/** Canonical registry for the four first-party Titan mobile experiences. */
final class PlatformApplicationRegistry
{
    public const VERSION = '4.0.0';

    private const APPLICATIONS = [
        'titan-hub' => [
            'name' => 'Titan Hub',
            'surface' => 'customer',
            'audience' => ['customer'],
            'purpose' => 'Online-first customer self-service backed by CRM read models and governed external intents.',
            'owns_business_records' => false,
            'legacy_slugs' => ['titan-customer'],
        ],
        'titan-go' => [
            'name' => 'Titan Go',
            'surface' => 'field',
            'audience' => ['field-worker', 'technician', 'cleaner', 'supervisor'],
            'purpose' => 'Offline-first field presentation for assigned work, evidence, checklists and sync state.',
            'owns_business_records' => false,
            'legacy_slugs' => ['titan-dispatch'],
        ],
        'titan-command' => [
            'name' => 'Titan Command',
            'surface' => 'owner',
            'audience' => ['owner', 'manager', 'administrator'],
            'purpose' => 'Online-first mobile command centre with read-only cached fallback.',
            'owns_business_records' => false,
            'legacy_slugs' => ['titan-owner', 'titan-zero', 'titan-launch', 'titan-desk', 'titan-front-desk'],
        ],
        'titan-onboarding' => [
            'name' => 'Titan Onboarding',
            'surface' => 'onboarding',
            'audience' => ['business-owner', 'administrator'],
            'purpose' => 'Conversation-first company setup and four-surface application provisioning.',
            'owns_business_records' => false,
            'legacy_slugs' => [],
        ],
    ];

    public static function all(): array { return self::APPLICATIONS; }
    public static function slugs(): array { return array_keys(self::APPLICATIONS); }
    public static function has(string $slug): bool { return isset(self::APPLICATIONS[$slug]); }

    public static function get(string $slug): array
    {
        $canonical = self::canonicalSlug($slug);
        if ($canonical === null) { throw new InvalidArgumentException("Unknown Titan platform application: {$slug}"); }
        return ['slug' => $canonical] + self::APPLICATIONS[$canonical];
    }

    public static function canonicalSlug(?string $slug): ?string
    {
        $slug = trim((string) $slug);
        if ($slug === '') { return 'titan-command'; }
        if (self::has($slug)) { return $slug; }
        foreach (self::APPLICATIONS as $canonical => $application) {
            if (in_array($slug, $application['legacy_slugs'], true)) { return $canonical; }
        }
        return null;
    }

    public static function surfaceFor(string $slug): string { return (string) self::get($slug)['surface']; }

    public static function legacyMap(): array
    {
        $map = [];
        foreach (self::APPLICATIONS as $canonical => $application) {
            foreach ($application['legacy_slugs'] as $legacy) { $map[$legacy] = $canonical; }
        }
        return $map;
    }

    public static function isLegacySlug(string $slug): bool { return isset(self::legacyMap()[$slug]); }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Management;

use App\Extensions\TitanBuilder\System\Models\BuilderSetting;
use InvalidArgumentException;

final class BuilderSettingsRepository
{
    private const COMPANY_DEFAULTS = [
        'default_surface' => 'customer',
        'preview_device' => 'mobile',
        'preview_network_state' => 'online',
        'ai_assistance' => true,
        'show_readiness_warnings' => true,
        'compact_navigation' => false,
        'reduced_motion' => false,
        'default_theme_mode' => 'system',
    ];

    private const PLATFORM_DEFAULTS = [
        'management_ui_enabled' => true,
        'ai_generation_enabled' => true,
        'asset_uploads_enabled' => true,
        'premium_mobile_enabled' => true,
        'default_preview_device' => 'mobile',
        'diagnostics_level' => 'standard',
        'show_experimental_resources' => false,
    ];

    /** @return array<string,mixed> */
    public function companySettings(int $companyId): array
    {
        if ($companyId < 1) {
            throw new InvalidArgumentException('A positive company_id is required.');
        }

        return array_replace(self::COMPANY_DEFAULTS, $this->rows('company:'.$companyId, $companyId));
    }

    /** @param array<string,mixed> $settings @return array<string,mixed> */
    public function updateCompanySettings(int $companyId, array $settings, ?string $actorId = null): array
    {
        if ($companyId < 1) {
            throw new InvalidArgumentException('A positive company_id is required.');
        }
        $clean = $this->filterKnown($settings, array_keys(self::COMPANY_DEFAULTS));
        foreach ($clean as $key => $value) {
            BuilderSetting::query()->updateOrCreate(
                ['owner_key' => 'company:'.$companyId, 'key' => $key],
                ['company_id' => $companyId, 'scope' => 'company', 'value' => $value, 'created_by' => $actorId]
            );
        }
        return $this->companySettings($companyId);
    }

    /** @return array<string,mixed> */
    public function platformSettings(): array
    {
        return array_replace(self::PLATFORM_DEFAULTS, $this->rows('platform', null));
    }

    /** @param array<string,mixed> $settings @return array<string,mixed> */
    public function updatePlatformSettings(array $settings, ?string $actorId = null): array
    {
        $clean = $this->filterKnown($settings, array_keys(self::PLATFORM_DEFAULTS));
        foreach ($clean as $key => $value) {
            BuilderSetting::query()->updateOrCreate(
                ['owner_key' => 'platform', 'key' => $key],
                ['company_id' => null, 'scope' => 'platform', 'value' => $value, 'created_by' => $actorId]
            );
        }
        return $this->platformSettings();
    }

    /** @return array<string,mixed> */
    private function rows(string $ownerKey, ?int $companyId): array
    {
        $query = BuilderSetting::query()->where('owner_key', $ownerKey);
        if ($companyId === null) {
            $query->whereNull('company_id')->where('scope', 'platform');
        } else {
            $query->where('company_id', $companyId)->where('scope', 'company');
        }

        $out = [];
        foreach ($query->get(['key', 'value']) as $row) {
            $out[(string) $row->key] = $row->value;
        }
        return $out;
    }

    /** @param array<string,mixed> $settings @param list<string> $allowed @return array<string,mixed> */
    private function filterKnown(array $settings, array $allowed): array
    {
        $unknown = array_diff(array_keys($settings), $allowed);
        if ($unknown !== []) {
            throw new InvalidArgumentException('Unknown Titan Builder setting: '.implode(', ', $unknown));
        }
        return $settings;
    }
}

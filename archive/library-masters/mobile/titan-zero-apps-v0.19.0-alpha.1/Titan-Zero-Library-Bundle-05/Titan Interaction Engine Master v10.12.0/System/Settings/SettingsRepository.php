<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Settings;

use Illuminate\Support\Facades\Schema;

final class SettingsRepository
{
    public function platform(string $key): mixed
    {
        if (!$this->tableAvailable('interaction_platform_settings')) return null;
        $row = app('db')->table('interaction_platform_settings')->where('key', $key)->first();
        return $row ? $this->decode($row->value ?? null) : null;
    }

    /** @return array<string,mixed> */
    public function platformAll(): array
    {
        if (!$this->tableAvailable('interaction_platform_settings')) return [];
        return app('db')->table('interaction_platform_settings')->limit(5000)->get()->mapWithKeys(
            fn ($row): array => [(string) $row->key => $this->decode($row->value ?? null)]
        )->all();
    }

    public function putPlatformMany(array $settings, int|string|null $actorId): void
    {
        if (!$this->tableAvailable('interaction_platform_settings')) throw new \RuntimeException('Interaction platform settings table is not available.');
        foreach ($settings as $key => $value) {
            app('db')->table('interaction_platform_settings')->updateOrInsert(
                ['key' => (string) $key],
                ['value' => $this->encode($value), 'updated_by' => $actorId === null ? null : (string) $actorId, 'updated_at' => now()]
            );
        }
    }

    public function company(string $companyId, string $key): mixed
    {
        if (!$this->tableAvailable('interaction_company_settings')) return null;
        $row = app('db')->table('interaction_company_settings')->where('company_id', $companyId)->where('key', $key)->first();
        return $row ? $this->decode($row->value ?? null) : null;
    }

    /** @return array<string,mixed> */
    public function companyAll(string $companyId): array
    {
        if (!$this->tableAvailable('interaction_company_settings')) return [];
        return app('db')->table('interaction_company_settings')->where('company_id', $companyId)->limit(5000)->get()->mapWithKeys(
            fn ($row): array => [(string) $row->key => $this->decode($row->value ?? null)]
        )->all();
    }

    public function putCompanyMany(string $companyId, array $settings, int|string|null $actorId): void
    {
        if ($companyId === '') throw new \InvalidArgumentException('company_id is required.');
        if (!$this->tableAvailable('interaction_company_settings')) throw new \RuntimeException('Interaction company settings table is not available.');
        foreach ($settings as $key => $value) {
            app('db')->table('interaction_company_settings')->updateOrInsert(
                ['company_id' => $companyId, 'key' => (string) $key],
                ['value' => $this->encode($value), 'updated_by' => $actorId === null ? null : (string) $actorId, 'updated_at' => now()]
            );
        }
    }

    /** @return array<string,mixed> */
    public function userAll(string $companyId, int|string $userId): array
    {
        if (!$this->tableAvailable('interaction_user_preferences')) return [];
        return app('db')->table('interaction_user_preferences')
            ->where('company_id', $companyId)->where('user_id', $userId)->limit(5000)->get()
            ->mapWithKeys(fn ($row): array => [(string) $row->key => $this->decode($row->value ?? null)])->all();
    }

    public function putUserMany(string $companyId, int|string $userId, array $settings): void
    {
        if ($companyId === '') throw new \InvalidArgumentException('company_id is required.');
        if (!$this->tableAvailable('interaction_user_preferences')) throw new \RuntimeException('Interaction user preferences table is not available.');
        foreach ($settings as $key => $value) {
            app('db')->table('interaction_user_preferences')->updateOrInsert(
                ['company_id' => $companyId, 'user_id' => $userId, 'key' => (string) $key],
                ['value' => $this->encode($value), 'updated_at' => now()]
            );
        }
    }

    private function tableAvailable(string $table): bool
    {
        try { return Schema::hasTable($table); }
        catch (\Throwable) { return false; }
    }

    private function encode(mixed $value): string
    {
        return json_encode($value, JSON_THROW_ON_ERROR);
    }

    private function decode(mixed $value): mixed
    {
        if ($value === null) return null;
        if (is_bool($value) || is_int($value) || is_float($value) || is_array($value)) return $value;
        try { return json_decode((string) $value, true, 512, JSON_THROW_ON_ERROR); }
        catch (\Throwable) { return $value; }
    }
}

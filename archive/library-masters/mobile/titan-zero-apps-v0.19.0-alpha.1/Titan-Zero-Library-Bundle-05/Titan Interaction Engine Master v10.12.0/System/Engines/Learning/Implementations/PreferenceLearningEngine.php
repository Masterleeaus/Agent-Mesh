<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Learning\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Learning\Contracts\PreferenceLearningEngineInterface;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;

final class PreferenceLearningEngine implements PreferenceLearningEngineInterface
{
    public function __construct(private readonly CompanyExecutionContext $tenantContext)
    {
    }

    public function recordPreference(int $userId, string $key, $value): void
    {
        app('db')->table('interaction_user_preferences')->updateOrInsert(
            ['company_id' => $this->tenantContext->companyId(), 'user_id' => $userId, 'key' => $key],
            ['value' => json_encode($value, JSON_THROW_ON_ERROR), 'updated_at' => now()]
        );
    }

    public function getPreference(int $userId, string $key)
    {
        $record = app('db')->table('interaction_user_preferences')
            ->where('company_id', $this->tenantContext->companyId())
            ->where('user_id', $userId)
            ->where('key', $key)
            ->first();
        return $record ? json_decode($record->value) : null;
    }

    public function getAllPreferences(int $userId): array
    {
        return app('db')->table('interaction_user_preferences')
            ->where('company_id', $this->tenantContext->companyId())
            ->where('user_id', $userId)
            ->limit(5000)->get()
            ->mapWithKeys(fn($r) => [$r->key => json_decode($r->value)])
            ->all();
    }
}

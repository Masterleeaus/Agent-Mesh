<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use RuntimeException;

trait BelongsToCompany
{
    public function scopeForCompany(Builder $query, int $companyId): Builder
    {
        if ($companyId < 1) {
            throw new RuntimeException('A positive company_id scope is required.');
        }

        return $query->where($this->qualifyColumn('company_id'), $companyId);
    }

    protected static function bootBelongsToCompany(): void
    {
        static::creating(static function ($model): void {
            $companyId = (int) ($model->company_id ?? 0);
            if ($companyId < 1) {
                throw new RuntimeException('Titan Builder persisted objects require a positive company_id.');
            }
            $model->company_id = $companyId;
        });
    }

    protected function initializeBelongsToCompany(): void
    {
        $this->casts['company_id'] = 'integer';
    }
}

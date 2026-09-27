<?php

declare(strict_types=1);

namespace App\Extensions\TitanTrust\System\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use LogicException;
use Modules\TitanZeroAssurance\Services\ExecutionContextStore;

trait TenantScoped
{
    public static function bootTenantScoped(): void
    {
        static::creating(function ($model): void {
            if (!empty($model->company_id)) return;
            $companyId = self::resolveCompanyId();
            if ($companyId === null) {
                throw new LogicException('TitanTrust company-scoped writes require an explicit company execution context or authenticated company_id.');
            }
            $model->company_id = $companyId;
        });

        static::addGlobalScope('company_id', function (Builder $builder): void {
            $companyId = self::resolveCompanyId();
            if ($companyId === null) {
                $builder->whereRaw('1 = 0');
                return;
            }
            $builder->where($builder->getModel()->getTable() . '.company_id', $companyId);
        });
    }

    public function scopeCompany(Builder $query, int $companyId): Builder
    {
        if ($companyId <= 0) throw new LogicException('company_id must be positive.');
        return $query->withoutGlobalScope('company_id')->where($this->getTable() . '.company_id', $companyId);
    }

    private static function resolveCompanyId(): ?int
    {
        if (class_exists(ExecutionContextStore::class)) {
            try {
                $context = app(ExecutionContextStore::class)->current();
                if ($context !== null) return $context->companyId;
            } catch (\Throwable) {}
        }
        if (Auth::check() && isset(Auth::user()->company_id) && (int) Auth::user()->company_id > 0) {
            return (int) Auth::user()->company_id;
        }
        return null;
    }
}

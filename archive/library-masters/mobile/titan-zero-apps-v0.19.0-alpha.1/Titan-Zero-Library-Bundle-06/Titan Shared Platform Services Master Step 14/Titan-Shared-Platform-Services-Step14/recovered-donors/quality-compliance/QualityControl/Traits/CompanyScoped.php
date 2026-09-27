<?php

namespace Modules\QualityControl\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use LogicException;
use Modules\TitanZeroAssurance\Services\ExecutionContextStore;

trait CompanyScoped
{
    protected static function bootCompanyScoped(): void
    {
        static::creating(function ($model): void {
            if (!self::tableHasCompanyId($model)) {
                return;
            }

            if (!empty($model->company_id)) {
                return;
            }

            $companyId = self::resolveCompanyId();
            if ($companyId === null) {
                throw new LogicException('QualityControl company-scoped writes require an explicit company execution context or authenticated company_id.');
            }

            $model->company_id = $companyId;
        });

        static::addGlobalScope('company_id', function (Builder $builder): void {
            $model = $builder->getModel();
            if (!self::tableHasCompanyId($model)) {
                return;
            }

            $companyId = self::resolveCompanyId();
            if ($companyId === null) {
                // Fail closed: missing company context must never expose cross-company rows.
                $builder->whereRaw('1 = 0');
                return;
            }

            $builder->where($model->getTable() . '.company_id', $companyId);
        });
    }

    private static function resolveCompanyId(): ?int
    {
        if (class_exists(ExecutionContextStore::class)) {
            try {
                $store = app(ExecutionContextStore::class);
                $context = $store->current();
                if ($context !== null) {
                    return $context->companyId;
                }
            } catch (\Throwable) {
                // Kernel may not be registered in legacy hosts; continue to safe web fallback.
            }
        }

        if (Auth::check() && isset(Auth::user()->company_id) && (int) Auth::user()->company_id > 0) {
            return (int) Auth::user()->company_id;
        }

        return null;
    }

    private static function tableHasCompanyId(object $model): bool
    {
        if (property_exists($model, 'company_id')) {
            return true;
        }

        try {
            return Schema::hasColumn($model->getTable(), 'company_id');
        } catch (\Throwable) {
            // During early boot/migrations the table may not exist yet. In that case this trait
            // cannot establish that the model is company-scoped, so it does not add a scope.
            return false;
        }
    }
}

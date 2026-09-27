<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\Support;

use LogicException;
use Modules\TitanZeroAssurance\Services\ExecutionContextStore;

final class CompanyContext
{
    public static function resolve(?int $explicit = null): ?int
    {
        if ($explicit !== null && $explicit > 0) return $explicit;
        if (class_exists(ExecutionContextStore::class) && function_exists('app')) {
            try {
                $context = app(ExecutionContextStore::class)->current();
                if ($context !== null && $context->companyId > 0) return $context->companyId;
            } catch (\Throwable) {
            }
        }
        if (function_exists('company')) {
            try {
                $company = company();
                if ($company && (int) $company->id > 0) return (int) $company->id;
            } catch (\Throwable) {
            }
        }
        return null;
    }

    public static function require(?int $explicit = null): int
    {
        return self::resolve($explicit) ?? throw new LogicException('CustomerFeedback company-scoped writes require explicit company context.');
    }
}

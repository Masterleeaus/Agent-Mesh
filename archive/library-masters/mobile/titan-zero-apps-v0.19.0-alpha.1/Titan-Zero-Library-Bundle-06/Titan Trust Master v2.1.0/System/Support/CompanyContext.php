<?php

declare(strict_types=1);

namespace App\Extensions\TitanTrust\System\Support;

use Illuminate\Http\Request;
use LogicException;
use Modules\TitanZeroAssurance\Services\ExecutionContextStore;

final class CompanyContext
{
    public static function fromRequest(Request $request): int
    {
        if (class_exists(ExecutionContextStore::class)) {
            try {
                $context = app(ExecutionContextStore::class)->current();
                if ($context !== null) return $context->companyId;
            } catch (\Throwable) {}
        }
        $companyId = (int) ($request->user()?->company_id ?? 0);
        if ($companyId <= 0) throw new LogicException('TitanTrust requires company_id context.');
        return $companyId;
    }
}

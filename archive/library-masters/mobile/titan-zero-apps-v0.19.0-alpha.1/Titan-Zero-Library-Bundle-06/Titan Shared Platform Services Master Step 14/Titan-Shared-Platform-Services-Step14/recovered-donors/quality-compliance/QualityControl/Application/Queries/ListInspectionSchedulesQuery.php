<?php

namespace Modules\QualityControl\Application\Queries;

use Modules\QualityControl\Entities\Schedule;

final class ListInspectionSchedulesQuery
{
    public function handle(?int $companyId = null)
    {
        return Schedule::query()
            ->when($companyId, fn ($query) => $query->where('company_id', $companyId))
            ->latest('issue_date');
    }
}

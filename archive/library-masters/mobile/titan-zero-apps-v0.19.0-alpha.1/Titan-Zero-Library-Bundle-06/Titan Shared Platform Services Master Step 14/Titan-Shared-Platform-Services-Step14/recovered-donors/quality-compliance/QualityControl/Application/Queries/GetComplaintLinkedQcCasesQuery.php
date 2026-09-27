<?php

namespace Modules\QualityControl\Application\Queries;

use Modules\QualityControl\Entities\QcRecord;

final class GetComplaintLinkedQcCasesQuery
{
    public function handle(?int $companyId = null)
    {
        return QcRecord::query()
            ->when($companyId, fn ($query) => $query->where('company_id', $companyId))
            ->whereNotNull('complaint_id')
            ->latest();
    }
}

<?php

namespace Modules\QualityControl\Application\Queries;

use Modules\QualityControl\Entities\QcRecord;

final class ListRecleanRequestsQuery
{
    public function handle(?int $companyId = null)
    {
        return QcRecord::query()
            ->when($companyId, fn ($query) => $query->where('company_id', $companyId))
            ->where('status', 'reclean_required')
            ->latest('reclean_triggered_at');
    }
}

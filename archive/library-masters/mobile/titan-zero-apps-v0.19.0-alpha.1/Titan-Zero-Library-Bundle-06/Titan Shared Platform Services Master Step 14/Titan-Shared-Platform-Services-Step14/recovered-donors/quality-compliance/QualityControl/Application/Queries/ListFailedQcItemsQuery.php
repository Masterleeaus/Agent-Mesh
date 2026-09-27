<?php

namespace Modules\QualityControl\Application\Queries;

use Modules\QualityControl\Entities\QcRecordItem;

final class ListFailedQcItemsQuery
{
    public function handle(?int $companyId = null)
    {
        return QcRecordItem::query()
            ->when($companyId, fn ($query) => $query->where('company_id', $companyId))
            ->where('score', '<', 50)
            ->latest();
    }
}

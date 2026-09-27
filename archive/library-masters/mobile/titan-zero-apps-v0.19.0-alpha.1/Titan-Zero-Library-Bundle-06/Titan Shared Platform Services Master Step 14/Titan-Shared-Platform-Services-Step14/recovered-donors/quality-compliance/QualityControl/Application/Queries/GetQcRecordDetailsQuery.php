<?php

namespace Modules\QualityControl\Application\Queries;

use Modules\QualityControl\Entities\QcRecord;

final class GetQcRecordDetailsQuery
{
    public function handle(int $recordId, ?int $companyId = null): QcRecord
    {
        return QcRecord::query()
            ->when($companyId, fn ($query) => $query->where('company_id', $companyId))
            ->with(['items', 'template', 'cleaner', 'inspector'])
            ->findOrFail($recordId);
    }
}

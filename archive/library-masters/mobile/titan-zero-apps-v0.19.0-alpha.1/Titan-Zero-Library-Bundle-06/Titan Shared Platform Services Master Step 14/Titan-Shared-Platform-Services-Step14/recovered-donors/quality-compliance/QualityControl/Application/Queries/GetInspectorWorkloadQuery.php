<?php

namespace Modules\QualityControl\Application\Queries;

use Illuminate\Support\Facades\DB;
use Modules\QualityControl\Entities\QcRecord;

final class GetInspectorWorkloadQuery
{
    public function handle(?int $companyId = null)
    {
        return QcRecord::query()
            ->when($companyId, fn ($query) => $query->where('company_id', $companyId))
            ->select('inspected_by', DB::raw('COUNT(*) as inspections_count'))
            ->groupBy('inspected_by')
            ->orderByDesc('inspections_count')
            ->get();
    }
}

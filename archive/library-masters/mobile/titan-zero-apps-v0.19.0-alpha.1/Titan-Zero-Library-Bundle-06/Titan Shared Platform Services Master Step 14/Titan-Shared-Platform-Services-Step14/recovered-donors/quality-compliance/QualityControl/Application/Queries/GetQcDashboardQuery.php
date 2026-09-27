<?php

namespace Modules\QualityControl\Application\Queries;

use Modules\QualityControl\Entities\QcRecord;

final class GetQcDashboardQuery
{
    public function handle(?int $companyId = null): array
    {
        $base = QcRecord::query()->when($companyId, fn ($query) => $query->where('company_id', $companyId));

        return [
            'total_records' => (clone $base)->count(),
            'pass_count' => (clone $base)->where('status', 'pass')->count(),
            'fail_count' => (clone $base)->where('status', 'fail')->count(),
            'reclean_required_count' => (clone $base)->where('status', 'reclean_required')->count(),
            'avg_score' => (int) round((float) ((clone $base)->avg('overall_score') ?? 0)),
        ];
    }
}

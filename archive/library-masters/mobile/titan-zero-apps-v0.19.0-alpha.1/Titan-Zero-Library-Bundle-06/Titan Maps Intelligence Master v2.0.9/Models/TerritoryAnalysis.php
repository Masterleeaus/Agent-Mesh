<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

final class TerritoryAnalysis extends CompanyScopedModel
{
    protected $table = 'territory_analyses';

    protected $fillable = [
        'company_id',
        'branch_id',
        'workspace_id',
        'discovery_search_id',
        'search_area',
        'categories',
        'analysis_type',
        'methodology_version',
        'methodology_key',
        'observation_period',
        'input_summary',
        'area_square_km',
        'result_summary',
        'map_layer_reference',
        'generated_metrics',
        'findings',
        'source_coverage',
        'confidence',
        'generated_at'
    ];

    protected function casts(): array
    {
        return [
            'search_area' => 'array',
        'categories' => 'array',
        'observation_period' => 'array',
        'input_summary' => 'array',
        'result_summary' => 'array',
        'generated_metrics' => 'array',
        'findings' => 'array',
        'source_coverage' => 'array',
        'area_square_km' => 'float',
        'confidence' => 'float',
        'generated_at' => 'immutable_datetime'
        ];
    }

    public function cells(): HasMany
    {
        return $this->hasMany(TerritoryAnalysisCell::class, 'territory_analysis_id');
    }
}


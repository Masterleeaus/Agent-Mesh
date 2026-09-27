<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class TerritoryAnalysisResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'search_id' => $this->discovery_search_id, 'analysis_type' => $this->analysis_type,
            'search_area' => $this->search_area, 'methodology_key' => $this->methodology_key, 'methodology_version' => $this->methodology_version, 'area_square_km' => $this->area_square_km, 'input_summary' => $this->input_summary, 'result_summary' => $this->result_summary,
            'generated_metrics' => $this->generated_metrics, 'findings' => $this->findings, 'source_coverage' => $this->source_coverage,
            'confidence' => $this->confidence, 'generated_at' => $this->generated_at, 'cells' => $this->whenLoaded('cells', fn () => $this->cells->map(fn ($cell) => ['cell_key'=>$cell->cell_key,'center_latitude'=>$cell->center_latitude,'center_longitude'=>$cell->center_longitude,'north_boundary'=>$cell->north_boundary,'south_boundary'=>$cell->south_boundary,'east_boundary'=>$cell->east_boundary,'west_boundary'=>$cell->west_boundary,'area_square_km'=>$cell->area_square_km,'score'=>$cell->score,'confidence'=>$cell->confidence,'metrics'=>$cell->metrics])->all()),
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class TerritoryAnalysisCell extends CompanyScopedModel
{
    protected $table = 'territory_analysis_cells';
    protected $fillable = ['company_id','territory_analysis_id','cell_key','center_latitude','center_longitude','north_boundary','south_boundary','east_boundary','west_boundary','area_square_km','score','confidence','metrics'];
    protected function casts(): array { return ['center_latitude'=>'float','center_longitude'=>'float','north_boundary'=>'float','south_boundary'=>'float','east_boundary'=>'float','west_boundary'=>'float','area_square_km'=>'float','score'=>'float','confidence'=>'float','metrics'=>'array']; }
    public function analysis(): BelongsTo { return $this->belongsTo(TerritoryAnalysis::class,'territory_analysis_id'); }
}

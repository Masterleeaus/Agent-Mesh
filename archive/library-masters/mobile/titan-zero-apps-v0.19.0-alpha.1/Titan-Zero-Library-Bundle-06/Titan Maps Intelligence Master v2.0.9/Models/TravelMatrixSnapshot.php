<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

final class TravelMatrixSnapshot extends CompanyScopedModel
{
    protected $table = 'maps_travel_matrix_snapshots';

    protected $fillable = [
        'company_id','branch_id','workspace_id','request_signature','travel_mode','routing_preference',
        'provider','result_basis','source_snapshot_id','origin_count','destination_count','element_count',
        'origins','destinations','provider_error_code','metadata','calculated_at','stale_at','created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'origin_count'=>'integer','destination_count'=>'integer','element_count'=>'integer',
            'origins'=>'array','destinations'=>'array','metadata'=>'array',
            'calculated_at'=>'immutable_datetime','stale_at'=>'immutable_datetime',
        ];
    }

    public function elements(): HasMany
    {
        return $this->hasMany(TravelMatrixElement::class, 'matrix_snapshot_id')->orderBy('origin_index')->orderBy('destination_index');
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Models;

final class FieldRouteOptimizationProposal extends CompanyScopedModel
{
    protected $table = 'maps_field_route_optimisation_proposals';
    protected $fillable = [
        'company_id','field_route_public_id','input_hash','proposal_hash','baseline_stop_public_ids','proposed_stop_public_ids',
        'algorithm','baseline_distance_metres','optimised_distance_metres','distance_savings_metres','baseline_duration_seconds',
        'optimised_duration_seconds','duration_savings_seconds','schedule','window_violations','constraints','provenance','warnings',
        'expires_at','created_by_user_id',
    ];
    protected function casts(): array
    {
        return [
            'baseline_stop_public_ids'=>'array','proposed_stop_public_ids'=>'array','schedule'=>'array','window_violations'=>'array',
            'constraints'=>'array','provenance'=>'array','warnings'=>'array','expires_at'=>'immutable_datetime',
            'baseline_distance_metres'=>'integer','optimised_distance_metres'=>'integer','distance_savings_metres'=>'integer',
            'baseline_duration_seconds'=>'integer','optimised_duration_seconds'=>'integer','duration_savings_seconds'=>'integer',
        ];
    }
}

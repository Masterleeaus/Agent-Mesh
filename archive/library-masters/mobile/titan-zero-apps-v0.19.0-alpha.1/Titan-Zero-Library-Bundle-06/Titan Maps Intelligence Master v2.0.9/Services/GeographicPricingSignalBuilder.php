<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

final class GeographicPricingSignalBuilder
{
    /** @return array<int,array<string,mixed>> */
    public function build(array $evaluation): array
    {
        if (($evaluation['covered'] ?? false) !== true) {
            return [[
                'signal_type' => ($evaluation['blocked_by'] ?? null) ? 'excluded_area' : 'outside_service_area',
                'severity' => 'warning',
                'authoritative' => false,
                'application_status' => 'not_applied',
                'evidence' => ['blocked_by' => $evaluation['blocked_by'] ?? null],
            ]];
        }

        $signals = [[
            'signal_type' => 'inside_service_area', 'severity' => 'info', 'authoritative' => false, 'application_status' => 'not_applied',
            'evidence' => ['territory_id' => $evaluation['primary_territory_id'] ?? null],
        ]];
        if (! empty($evaluation['branch_public_id'])) {
            $signals[] = ['signal_type'=>'branch_affinity','severity'=>'info','authoritative'=>false,'application_status'=>'not_applied','evidence'=>['branch_public_id'=>$evaluation['branch_public_id']]];
        }
        if (isset($evaluation['road_distance_metres']) && is_numeric($evaluation['road_distance_metres'])) {
            $signals[] = ['signal_type'=>'travel_distance','severity'=>'info','authoritative'=>false,'application_status'=>'not_applied','evidence'=>['road_distance_metres'=>(int)$evaluation['road_distance_metres'],'basis'=>$evaluation['distance_basis'] ?? 'unknown']];
        }
        if (isset($evaluation['duration_seconds']) && is_numeric($evaluation['duration_seconds'])) {
            $signals[] = ['signal_type'=>'drive_time','severity'=>'info','authoritative'=>false,'application_status'=>'not_applied','evidence'=>['duration_seconds'=>(int)$evaluation['duration_seconds'],'basis'=>$evaluation['eta_basis'] ?? 'unknown']];
        }
        if (! empty($evaluation['travel_zone_id'])) {
            $mode = (string) ($evaluation['travel_match_mode'] ?? '');
            $signals[] = [
                'signal_type' => $mode === 'drive_time' ? 'drive_time_band' : 'remote_distance_band',
                'severity' => 'advisory', 'authoritative' => false, 'application_status' => 'not_applied',
                'evidence' => ['travel_zone_id'=>$evaluation['travel_zone_id'],'travel_zone_name'=>$evaluation['travel_zone_name'] ?? null,'match_mode'=>$mode],
            ];
        }
        $hint = $evaluation['pricing_hint'] ?? null;
        if (is_array($hint) && in_array(($hint['type'] ?? null), ['fixed','percent'], true) && is_numeric($hint['value'] ?? null)) {
            $signals[] = [
                'signal_type'=>'surcharge_hint','severity'=>'advisory','authoritative'=>false,'application_status'=>'not_applied',
                'hint_type'=>$hint['type'],'hint_value'=>(float)$hint['value'],'currency'=>$hint['currency'] ?? null,
                'evidence'=>['source_territory_id'=>$hint['source_territory_id'] ?? ($evaluation['primary_territory_id'] ?? null)],
            ];
        }
        return $signals;
    }
}

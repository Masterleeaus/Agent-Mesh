<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\DTO\TerritoryMatchResult;

final class ServiceTerritoryMatcher
{
    public function matches(array $territory, array $target): TerritoryMatchResult
    {
        $mode = strtolower(trim((string) ($territory['match_mode'] ?? '')));
        return match ($mode) {
            'circle' => $this->circle($territory, $target),
            'polygon' => $this->polygon($territory, $target),
            'postcode' => $this->locality($territory, $target, 'postcode'),
            'suburb' => $this->locality($territory, $target, 'suburb'),
            default => new TerritoryMatchResult(false, $mode !== '' ? $mode : 'unknown', evidence: ['reason' => 'unsupported_or_external_match_mode']),
        };
    }

    /** @return array{covered:bool,primary_territory_id:?string,branch_public_id:?string,blocked_by:?string,matches:array<int,array<string,mixed>>} */
    public function resolve(array $territories, array $target): array
    {
        $matches = [];
        foreach ($territories as $territory) {
            $result = $this->matches($territory, $target);
            if (! $result->matched) {
                continue;
            }
            $matches[] = [
                'id' => (string) ($territory['id'] ?? ''),
                'effect' => (string) ($territory['effect'] ?? 'include'),
                'priority' => (int) ($territory['priority'] ?? 0),
                'branch_public_id' => isset($territory['branch_public_id']) ? (string) $territory['branch_public_id'] : null,
                'basis' => $result->basis,
                'distance_metres' => $result->distanceMetres,
                'duration_seconds' => $result->durationSeconds,
                'evidence' => $result->evidence,
            ];
        }
        $primaryBranch=isset($target['primary_branch_public_id'])?(string)$target['primary_branch_public_id']:null;
        $branchDistances=(array)($target['branch_distances_metres']??[]);
        usort($matches, static function(array $a,array $b) use($primaryBranch,$branchDistances): int {
            $priority=($b['priority'] <=> $a['priority']); if($priority!==0) return $priority;
            $aPrimary=$primaryBranch!==null && ($a['branch_public_id']??null)===$primaryBranch ? 1:0;
            $bPrimary=$primaryBranch!==null && ($b['branch_public_id']??null)===$primaryBranch ? 1:0;
            if($aPrimary!==$bPrimary) return $bPrimary<=>$aPrimary;
            $aDistance=isset($a['branch_public_id'],$branchDistances[$a['branch_public_id']])?(float)$branchDistances[$a['branch_public_id']]:INF;
            $bDistance=isset($b['branch_public_id'],$branchDistances[$b['branch_public_id']])?(float)$branchDistances[$b['branch_public_id']]:INF;
            if($aDistance!==$bDistance) return $aDistance<=>$bDistance;
            return strcmp($a['id'],$b['id']);
        });
        $exclude = current(array_filter($matches, static fn (array $m): bool => $m['effect'] === 'exclude')) ?: null;
        $include = current(array_filter($matches, static fn (array $m): bool => $m['effect'] === 'include')) ?: null;
        $chain=array_map(static fn(array $m):array=>['territory_id'=>$m['id'],'effect'=>$m['effect'],'priority'=>$m['priority'],'branch_public_id'=>$m['branch_public_id'],'basis'=>$m['basis']],$matches);
        return [
            'covered' => $exclude === null && $include !== null,
            'primary_territory_id' => $exclude === null ? ($include['id'] ?? null) : null,
            'branch_public_id' => $exclude === null ? ($include['branch_public_id'] ?? null) : null,
            'blocked_by' => $exclude['id'] ?? null,
            'matches' => $matches,
            'matched_rule_chain' => $chain,
            'resolution_basis' => 'priority_then_primary_branch_then_nearest_branch_then_stable_id',
        ];
    }

    private function circle(array $territory, array $target): TerritoryMatchResult
    {
        $lat = $this->number($target['latitude'] ?? null);
        $lng = $this->number($target['longitude'] ?? null);
        $centerLat = $this->number($territory['center_latitude'] ?? null);
        $centerLng = $this->number($territory['center_longitude'] ?? null);
        $radius = $this->number($territory['radius_metres'] ?? null);
        if ($lat === null || $lng === null || $centerLat === null || $centerLng === null || $radius === null || $radius <= 0) {
            return new TerritoryMatchResult(false, 'circle', evidence: ['reason' => 'missing_geometry']);
        }
        $distance = $this->haversine($centerLat, $centerLng, $lat, $lng);
        return new TerritoryMatchResult($distance <= $radius, 'circle', $distance, evidence: ['radius_metres' => $radius]);
    }

    private function polygon(array $territory, array $target): TerritoryMatchResult
    {
        $lat = $this->number($target['latitude'] ?? null);
        $lng = $this->number($target['longitude'] ?? null);
        if ($lat === null || $lng === null) {
            return new TerritoryMatchResult(false, 'polygon', evidence: ['reason' => 'missing_target_coordinates']);
        }
        $points = [];
        foreach ((array) ($territory['geometry'] ?? []) as $point) {
            if (! is_array($point)) continue;
            $pLat = $this->number($point['lat'] ?? $point['latitude'] ?? null);
            $pLng = $this->number($point['lng'] ?? $point['longitude'] ?? null);
            if ($pLat !== null && $pLng !== null) $points[] = [$pLat, $pLng];
        }
        if (count($points) < 3) {
            return new TerritoryMatchResult(false, 'polygon', evidence: ['reason' => 'invalid_polygon']);
        }
        $inside = false; $onBoundary=false;
        for ($i = 0, $j = count($points) - 1; $i < count($points); $j = $i++) {
            [$yi, $xi] = $points[$i]; [$yj, $xj] = $points[$j];
            if($this->pointOnSegment($lat,$lng,$yj,$xj,$yi,$xi)){ $onBoundary=true; $inside=true; break; }
            $intersects = (($yi > $lat) !== ($yj > $lat)) && ($lng < ($xj - $xi) * ($lat - $yi) / (($yj - $yi) ?: 1e-12) + $xi);
            if ($intersects) $inside = ! $inside;
        }
        return new TerritoryMatchResult($inside, 'polygon', evidence: ['vertices' => count($points),'boundary_match'=>$onBoundary]);
    }

    private function locality(array $territory, array $target, string $field): TerritoryMatchResult
    {
        $needle = $this->normalise((string) ($target[$field] ?? ''));
        if ($needle === '') return new TerritoryMatchResult(false, $field, evidence: ['reason' => 'missing_target_'.$field]);
        $values = array_values(array_filter(array_map(fn ($v): string => $this->normalise((string) $v), (array) ($territory['locality_values'] ?? []))));
        return new TerritoryMatchResult(in_array($needle, $values, true), $field, evidence: ['value' => $needle]);
    }


    private function pointOnSegment(float $py,float $px,float $ay,float $ax,float $by,float $bx): bool
    {
        $cross=($px-$ax)*($by-$ay)-($py-$ay)*($bx-$ax);
        if(abs($cross)>1e-9) return false;
        $dot=($px-$ax)*($bx-$ax)+($py-$ay)*($by-$ay); if($dot<0) return false;
        $lenSq=($bx-$ax)**2+($by-$ay)**2; return $dot<=$lenSq+1e-9;
    }

    private function normalise(string $value): string
    {
        $value = trim(function_exists('mb_strtolower') ? mb_strtolower($value) : strtolower($value));
        return preg_replace('/\s+/u', ' ', $value) ?? $value;
    }

    private function number(mixed $value): ?float
    {
        return is_numeric($value) ? (float) $value : null;
    }

    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earth = 6371008.8;
        $p1 = deg2rad($lat1); $p2 = deg2rad($lat2);
        $dLat = deg2rad($lat2 - $lat1); $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos($p1) * cos($p2) * sin($dLng / 2) ** 2;
        return $earth * 2 * atan2(sqrt($a), sqrt(max(0.0, 1 - $a)));
    }
}

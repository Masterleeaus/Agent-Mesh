<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tests\Unit;

use App\Extensions\TitanMapsIntelligence\Models\MapGeofence;
use App\Extensions\TitanMapsIntelligence\Services\GeofenceGeometryService;
use App\Extensions\TitanMapsIntelligence\Support\GeofenceMath;
use PHPUnit\Framework\TestCase;

final class GeofenceGeometryServiceTest extends TestCase
{
    public function test_circle_uses_accuracy_and_hysteresis_for_stable_entry_and_exit(): void
    {
        $service = new GeofenceGeometryService(new GeofenceMath());
        $fence = new MapGeofence(['company_id'=>'c1','shape_type'=>'circle','center_latitude'=>-37.81,'center_longitude'=>144.96,'radius_metres'=>100]);
        self::assertTrue($service->contains($fence, -37.81, 144.96, 5, false, 10));
        self::assertFalse($service->contains($fence, -37.8089, 144.96, 5, false, 10));
    }

    public function test_polygon_contains_points_inside_and_excludes_points_outside(): void
    {
        $service = new GeofenceGeometryService(new GeofenceMath());
        $fence = new MapGeofence(['company_id'=>'c1','shape_type'=>'polygon','geometry'=>[
            ['lat'=>-37.82,'lng'=>144.95],['lat'=>-37.82,'lng'=>144.97],['lat'=>-37.80,'lng'=>144.97],['lat'=>-37.80,'lng'=>144.95],
        ]]);
        self::assertTrue($service->contains($fence, -37.81, 144.96));
        self::assertFalse($service->contains($fence, -37.85, 144.96));
    }
}

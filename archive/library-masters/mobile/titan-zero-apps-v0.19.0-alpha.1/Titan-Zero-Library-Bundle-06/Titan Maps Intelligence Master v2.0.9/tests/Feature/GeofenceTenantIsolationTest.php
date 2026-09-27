<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tests\Feature;

use App\Extensions\TitanMapsIntelligence\Models\MapGeofence;
use Tests\TestCase;

final class GeofenceTenantIsolationTest extends TestCase
{
    public function test_company_scope_never_returns_another_company_geofence(): void
    {
        MapGeofence::query()->create(['company_id'=>'company-a','name'=>'A','shape_type'=>'circle','center_latitude'=>-37.81,'center_longitude'=>144.96,'radius_metres'=>100]);
        MapGeofence::query()->create(['company_id'=>'company-b','name'=>'B','shape_type'=>'circle','center_latitude'=>-37.82,'center_longitude'=>144.97,'radius_metres'=>100]);
        self::assertSame(['A'], MapGeofence::query()->forCompany('company-a')->pluck('name')->all());
    }
}

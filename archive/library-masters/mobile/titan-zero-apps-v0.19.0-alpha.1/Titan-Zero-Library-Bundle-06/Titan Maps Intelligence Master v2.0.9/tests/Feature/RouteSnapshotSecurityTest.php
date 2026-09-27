<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tests\Feature;

use App\Extensions\TitanMapsIntelligence\Models\RouteSnapshot;
use Tests\TestCase;

final class RouteSnapshotSecurityTest extends TestCase
{
    public function test_company_scope_never_returns_another_company_route_snapshot(): void
    {
        $base = [
            'request_signature'=>'sig','origin_latitude'=>-37.81,'origin_longitude'=>144.96,
            'destination_latitude'=>-37.82,'destination_longitude'=>144.97,'travel_mode'=>'DRIVE',
            'routing_preference'=>'TRAFFIC_AWARE','provider'=>'google-routes','result_basis'=>'provider_route',
            'road_distance_metres'=>2000,'straight_line_distance_metres'=>1500,'calculated_at'=>now(),
        ];
        RouteSnapshot::query()->create(['company_id'=>'company-a'] + $base);
        RouteSnapshot::query()->create(['company_id'=>'company-b'] + $base);
        self::assertCount(1, RouteSnapshot::query()->forCompany('company-a')->get());
    }
}

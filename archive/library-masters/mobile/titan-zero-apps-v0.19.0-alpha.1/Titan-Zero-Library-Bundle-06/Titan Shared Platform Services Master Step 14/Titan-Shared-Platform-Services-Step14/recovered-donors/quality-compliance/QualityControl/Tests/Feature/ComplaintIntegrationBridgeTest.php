<?php

namespace Modules\QualityControl\Tests\Feature;

use Tests\TestCase;

class ComplaintIntegrationBridgeTest extends TestCase
{
    public function test_quality_control_and_complaint_integration_routes_are_registered(): void
    {
        $this->assertTrue(\Route::has('inspection_schedules.create_quality_issue'));
        $this->assertTrue(\Route::has('inspection_schedules.set_outcome'));
    }
}

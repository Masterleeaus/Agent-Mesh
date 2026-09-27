<?php
// UI label: Site Inspections (Pass 2)

namespace Modules\QualityControl\Tests\Feature;

use Tests\TestCase;

class RoutesTest extends TestCase
{
    /** @test */
    public function it_registers_expected_route_names(): void
    {
        $this->assertTrue(\Route::has('quality-control.index'));
        $this->assertTrue(\Route::has('qc-records.index'));
        $this->assertTrue(\Route::has('inspection_schedules.index'));
        $this->assertTrue(\Route::has('schedule-inspection.index'));
    }
}

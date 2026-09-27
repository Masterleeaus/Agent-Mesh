<?php
// UI label: Site Inspections (Pass 2)

namespace Modules\QualityControl\Tests\Feature;

use Modules\QualityControl\Support\InspectionPermissions;
use Tests\TestCase;

class PermissionsTest extends TestCase
{
    /** @test */
    public function permissions_keys_are_defined(): void
    {
        $this->assertNotEmpty(InspectionPermissions::aliasesFor(InspectionPermissions::VIEW));
        $this->assertNotEmpty(InspectionPermissions::aliasesFor(InspectionPermissions::CREATE));
        $this->assertContains('view_inspection', InspectionPermissions::aliasesFor(InspectionPermissions::VIEW));
        $this->assertContains('create_inspection', InspectionPermissions::aliasesFor(InspectionPermissions::CREATE));
    }
}

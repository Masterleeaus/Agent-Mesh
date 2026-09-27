<?php

namespace Modules\QualityControl\Tests\Feature;

use Modules\QualityControl\Support\InspectionPermissions;
use Tests\TestCase;

class OwnershipBridgeRegressionTest extends TestCase
{
    public function test_quality_control_routes_cover_bridge_endpoints(): void
    {
        $this->assertTrue(\Route::has('qc-records.approve'));
        $this->assertTrue(\Route::has('qc-records.request_reclean'));
    }

    public function test_permission_aliases_include_legacy_inspection_permissions(): void
    {
        $viewAliases = InspectionPermissions::aliasesFor(InspectionPermissions::VIEW);
        $createAliases = InspectionPermissions::aliasesFor(InspectionPermissions::CREATE);

        $this->assertContains('inspection.view', $viewAliases);
        $this->assertContains('view_inspection', $viewAliases);
        $this->assertContains('inspection.create', $createAliases);
        $this->assertContains('create_inspection', $createAliases);
    }
}


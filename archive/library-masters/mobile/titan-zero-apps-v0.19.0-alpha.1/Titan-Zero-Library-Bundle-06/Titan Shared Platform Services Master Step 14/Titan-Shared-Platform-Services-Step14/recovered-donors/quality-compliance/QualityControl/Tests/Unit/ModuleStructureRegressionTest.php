<?php

namespace Modules\QualityControl\Tests\Unit;

use Tests\TestCase;

class ModuleStructureRegressionTest extends TestCase
{
    public function test_domain_actions_and_queries_are_autoloadable(): void
    {
        $this->assertTrue(class_exists(\Modules\QualityControl\Domain\Quality\Actions\CreateQcRecordAction::class));
        $this->assertTrue(class_exists(\Modules\QualityControl\Domain\Quality\Actions\CreateQcFromComplaintAction::class));
        $this->assertTrue(class_exists(\Modules\QualityControl\Application\Queries\GetQcDashboardQuery::class));
    }

    public function test_qc_manifests_are_present_and_well_formed(): void
    {
        $permissions = include module_path('QualityControl', 'manifests/permissions.php');
        $settings = include module_path('QualityControl', 'manifests/settings.php');
        $seeders = include module_path('QualityControl', 'manifests/seeders.php');

        $this->assertIsArray($permissions);
        $this->assertContains('manage_qc_corrective_actions', $permissions['permissions']);
        $this->assertArrayHasKey('pass_threshold', $settings);
        $this->assertArrayHasKey('database', $seeders);
    }
}

<?php

declare(strict_types=1);

use App\Extensions\TitanBuilder\System\Contracts\ApplicationProvisioningGateway;
use App\Extensions\TitanBuilder\System\Models\BuilderProject;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class FourPwaProvisioningTest extends TestCase
{
    use RefreshDatabase;

    public function test_four_surface_creation_is_company_scoped_and_idempotent(): void
    {
        $gateway = app(ApplicationProvisioningGateway::class);
        $expected = ['customer'=>'Titan Hub','field'=>'Titan Go','owner'=>'Titan Command','onboarding'=>'Titan Onboarding'];

        foreach ($expected as $surface => $product) {
            $first = $gateway->createApplication(101, $surface, 'actor-1');
            $second = $gateway->createApplication(101, $surface, 'actor-1');
            self::assertSame($product, $first['product']);
            self::assertSame($first['project_id'], $second['project_id']);
            self::assertNotEmpty($first['pages']);
        }

        self::assertCount(4, BuilderProject::query()->forCompany(101)->whereIn('surface', array_keys($expected))->get());
        self::assertSame([], $gateway->getApplications(202));
    }
}

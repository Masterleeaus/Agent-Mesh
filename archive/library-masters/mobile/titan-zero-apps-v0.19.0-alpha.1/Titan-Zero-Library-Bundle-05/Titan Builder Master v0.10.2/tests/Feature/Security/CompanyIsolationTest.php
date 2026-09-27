<?php

declare(strict_types=1);

use App\Extensions\TitanBuilder\System\Models\BuilderProject;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class CompanyIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_company_scope_does_not_return_another_company_project(): void
    {
        BuilderProject::query()->create(['company_id'=>101,'name'=>'A','slug'=>'a','surface'=>'owner']);
        BuilderProject::query()->create(['company_id'=>202,'name'=>'B','slug'=>'b','surface'=>'owner']);

        self::assertSame(['A'], BuilderProject::query()->forCompany(101)->pluck('name')->all());
        self::assertSame(['B'], BuilderProject::query()->forCompany(202)->pluck('name')->all());
    }
}

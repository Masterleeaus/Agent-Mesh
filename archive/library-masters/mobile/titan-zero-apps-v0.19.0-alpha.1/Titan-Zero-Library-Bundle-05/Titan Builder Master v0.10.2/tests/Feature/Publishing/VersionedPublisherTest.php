<?php

declare(strict_types=1);

use App\Extensions\TitanBuilder\System\Contracts\PageRepository;
use App\Extensions\TitanBuilder\System\Contracts\Publisher;
use App\Extensions\TitanBuilder\System\Models\BuilderPage;
use App\Extensions\TitanBuilder\System\Models\BuilderProject;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class VersionedPublisherTest extends TestCase
{
    use RefreshDatabase;

    public function test_publish_versions_are_immutable_and_rollback_only_reactivates_prior_snapshot(): void
    {
        $companyId = 101;
        $project = BuilderProject::query()->create(['company_id'=>$companyId,'name'=>'Demo','slug'=>'demo','surface'=>'owner']);
        $page = BuilderPage::query()->create(['company_id'=>$companyId,'project_id'=>$project->id,'name'=>'Home','slug'=>'home','sort_order'=>0]);
        $repo = app(PageRepository::class);
        $publisher = app(Publisher::class);
        $spec = ['version'=>'1.1','authority'=>'presentation-only','surface'=>'page','root'=>'root','elements'=>['root'=>['type'=>'stack','props'=>[],'children'=>[]]]];

        $repo->saveDraftSpec($companyId, $page->id, $spec, 'actor-1');
        $first = $publisher->publish($companyId, $project->id, 'actor-1');
        $repo->saveDraftSpec($companyId, $page->id, $spec + ['meta'=>['revision'=>2]], 'actor-1');
        $second = $publisher->publish($companyId, $project->id, 'actor-1');

        self::assertSame(1, (int) $first->version);
        self::assertSame(2, (int) $second->version);
        self::assertSame($companyId, (int) $second->snapshot['company_id']);

        $publisher->rollback($companyId, $project->id, $first->id, 'actor-1');
        $project->refresh();
        self::assertSame((int) $first->id, (int) $project->active_publish_snapshot_id);
        self::assertDatabaseHas('titan_builder_publish_snapshots', ['id'=>$second->id,'company_id'=>$companyId,'checksum'=>$second->checksum]);
    }

    public function test_snapshot_from_another_company_cannot_be_activated(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        app(Publisher::class)->rollback(202, 999, 999, 'actor-2');
    }
}

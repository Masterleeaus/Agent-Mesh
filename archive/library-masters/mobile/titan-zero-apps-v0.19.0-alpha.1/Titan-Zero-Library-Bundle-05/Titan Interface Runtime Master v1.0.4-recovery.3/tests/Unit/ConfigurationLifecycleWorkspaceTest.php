<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorityReadResult;
use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorizedViewReader;
use App\Extensions\TitanInterfaceRuntime\System\Authority\InMemoryReadCache;
use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadAuthorityRouter;
use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadQuery;
use App\Extensions\TitanInterfaceRuntime\System\Configuration\ConfigurationLifecycleWorkspaceComposer;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\ReadAuthorityAdapterContract;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ArrayComponentVocabulary;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationComponentPolicy;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryActionRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryObjectRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryViewRegistry;
use PHPUnit\Framework\TestCase;

final class ConfigurationLifecycleWorkspaceTest extends TestCase
{
    public function test_configuration_versions_remain_source_owned_and_actions_are_handoffs(): void
    {
        $contributions = ['builder'=>[
            'schema_version'=>'1.1',
            'objects'=>[[
                'key'=>'builder.page','label'=>'Page','data_authority'=>'titan-builder','scope'=>['type'=>'tenant','tenant_key'=>'company_id'],
                'product_surfaces'=>['command'],'customer_safe'=>false,'permissions'=>['builder.page.view'],'lifecycle_ref'=>null,
                'facet_refs'=>[],'view_refs'=>['builder.page.configuration'],'action_refs'=>['builder.page.preview','builder.page.validate','builder.page.publish','builder.page.rollback'],'relationship_refs'=>[],'offline_mode'=>'read-only',
            ]],
            'relationships'=>[],
            'views'=>[[
                'key'=>'builder.page.configuration','label'=>'Page Configuration','kind'=>'canvas','applies_to'=>['builder.page'],'product_surfaces'=>['command'],'customer_safe'=>false,
                'permissions'=>['builder.page.view'],'data_source'=>['authority'=>'titan-builder','mode'=>'read-model','reference'=>'page.configuration-lifecycle'],'component_hint'=>'configuration-lifecycle',
            ]],
            'actions'=>[
                ['key'=>'builder.page.preview','label'=>'Preview','applies_to'=>['builder.page'],'mutating'=>false,'capability_ref'=>'builder.page.preview','interaction'=>null,'product_surfaces'=>['command'],'permissions'=>['builder.page.view'],'offline_mode'=>'online-required','requires_confirmation'=>false,'container_hint'=>'full-workspace','customer_safe'=>false],
                ['key'=>'builder.page.validate','label'=>'Validate','applies_to'=>['builder.page'],'mutating'=>false,'capability_ref'=>'builder.page.validate','interaction'=>null,'product_surfaces'=>['command'],'permissions'=>['builder.page.view'],'offline_mode'=>'online-required','requires_confirmation'=>false,'container_hint'=>'panel','customer_safe'=>false],
                ['key'=>'builder.page.publish','label'=>'Publish','applies_to'=>['builder.page'],'mutating'=>true,'capability_ref'=>'builder.page.publish','interaction'=>null,'product_surfaces'=>['command'],'permissions'=>['builder.page.publish'],'offline_mode'=>'online-required','requires_confirmation'=>true,'container_hint'=>'modal','customer_safe'=>false],
                ['key'=>'builder.page.rollback','label'=>'Rollback','applies_to'=>['builder.page'],'mutating'=>true,'capability_ref'=>'builder.page.rollback','interaction'=>null,'product_surfaces'=>['command'],'permissions'=>['builder.page.publish'],'offline_mode'=>'online-required','requires_confirmation'=>true,'container_hint'=>'modal','customer_safe'=>false],
            ],
        ]];

        $objects = new InMemoryObjectRegistry(); $objects->rebuild($contributions);
        $views = new InMemoryViewRegistry($objects); $views->rebuild($contributions);
        $actions = new InMemoryActionRegistry($objects); $actions->rebuild($contributions);

        $adapter = new class implements ReadAuthorityAdapterContract {
            public function supports(string $authority,string $mode): bool { return $authority==='titan-builder' && $mode==='read-model'; }
            public function read(InterfaceContext $context,string $authority,string $reference,array $criteria=[]): AuthorityReadResult {
                return new AuthorityReadResult($authority,$reference,[
                    'status'=>'validated',
                    'current_version'=>['id'=>'v3','label'=>'Draft v3','state'=>'draft','created_at'=>'2026-08-18T10:00:00Z','actor_ref'=>'user:11'],
                    'published_version'=>['id'=>'v2','label'=>'Published v2','state'=>'published','published_at'=>'2026-08-17T10:00:00Z'],
                    'preview'=>['available'=>true,'source_ref'=>'preview:v3','label'=>'Preview draft v3','expires_at'=>'2026-08-18T11:00:00Z','html'=>'MUST_NOT_CROSS_BOUNDARY'],
                    'validation'=>['status'=>'valid','errors'=>[],'warnings'=>['Image alt text recommended'],'source_ref'=>'builder-validation:v3'],
                    'history'=>[
                        ['id'=>'v3','label'=>'Draft v3','state'=>'draft','created_at'=>'2026-08-18T10:00:00Z','actor_ref'=>'user:11','summary'=>'Hero copy changed','current'=>true],
                        ['id'=>'v2','label'=>'Published v2','state'=>'published','published_at'=>'2026-08-17T10:00:00Z','summary'=>'Initial publish','published'=>true],
                    ],
                    'rollback'=>['available'=>true,'target_version_id'=>'v2','label'=>'Rollback to Published v2'],
                    'action_refs'=>['preview'=>'builder.page.preview','validate'=>'builder.page.validate','publish'=>'builder.page.publish','rollback'=>'builder.page.rollback'],
                    'configuration'=>['secret'=>'MUST_NOT_CROSS_BOUNDARY'],
                ],['source'=>'builder']);
            }
        };
        $reader = new AuthorizedViewReader($views,new ReadAuthorityRouter([$adapter],new InMemoryReadCache()));
        $presentation = new BuilderPresentationAdapter(new ArrayComponentVocabulary([
            'stack'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
            'report-shell'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
        ]),new PresentationComponentPolicy());
        $composer = new ConfigurationLifecycleWorkspaceComposer($objects,$views,$actions,$reader,$presentation);
        $context = new InterfaceContext(7,11,'command','platform',capabilities:['builder.page.view','builder.page.publish'],traceId:'trace-17',correlationId:'corr-17');

        $snapshot = $composer->open(ObjectReference::tenant('builder.page',7,'P1'),$context,new ReadQuery());
        self::assertSame('validated',$snapshot->status);
        self::assertSame('v3',$snapshot->currentVersion['id']);
        self::assertSame('v2',$snapshot->publishedVersion['id']);
        self::assertCount(2,$snapshot->history);
        self::assertCount(4,$snapshot->actionIntents);
        foreach ($snapshot->actionIntents as $intent) self::assertFalse($intent['executable']);
        self::assertArrayNotHasKey('html',$snapshot->preview);
        self::assertStringNotContainsString('MUST_NOT_CROSS_BOUNDARY',json_encode($snapshot->jsonSerialize(),JSON_THROW_ON_ERROR));
        self::assertSame('source-extension',$snapshot->policy['version_authority']);
        self::assertFalse($snapshot->policy['interface_runtime_stores_configuration_versions']);
    }
}

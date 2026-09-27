<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorityReadResult;
use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorizedViewReader;
use App\Extensions\TitanInterfaceRuntime\System\Authority\InMemoryReadCache;
use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadAuthorityRouter;
use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadQuery;
use App\Extensions\TitanInterfaceRuntime\System\Collection\CollectionViewSwitcher;
use App\Extensions\TitanInterfaceRuntime\System\Collection\InMemoryCollectionViewPreferenceStore;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\ReadAuthorityAdapterContract;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ArrayComponentVocabulary;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationComponentPolicy;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryViewRegistry;
use PHPUnit\Framework\TestCase;

final class CollectionViewSwitchingTest extends TestCase
{
    public function test_switching_projection_reuses_same_authoritative_result_and_query():void
    {
        $views=new InMemoryViewRegistry(); $base=['applies_to'=>['crm.customer'],'product_surfaces'=>['command'],'customer_safe'=>false,'permissions'=>['crm.view'],'data_source'=>['authority'=>'crm','mode'=>'read-model','reference'=>'customers']];
        $views->rebuild(['crm'=>['views'=>[array_merge($base,['key'=>'cards','label'=>'Cards','kind'=>'cards']),array_merge($base,['key'=>'board','label'=>'Board','kind'=>'board'])]]]);
        $adapter=new class implements ReadAuthorityAdapterContract { public int $calls=0; public function supports(string $a,string $m):bool{return true;} public function read(InterfaceContext $c,string $a,string $r,array $q=[]):AuthorityReadResult{$this->calls++;return new AuthorityReadResult($a,$r,[['id'=>1]],[]);} };
        $switcher=new CollectionViewSwitcher($views,new AuthorizedViewReader($views,new ReadAuthorityRouter([$adapter],new InMemoryReadCache())),new BuilderPresentationAdapter(new ArrayComponentVocabulary(['entity-card'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true],'kanban-board'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true],'stack'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true]]),new PresentationComponentPolicy()),new InMemoryCollectionViewPreferenceStore());
        $context=new InterfaceContext(1,2,'command','customers',capabilities:['crm.view']); $query=new ReadQuery(page:3,perPage:20);
        $open=$switcher->open('crm.customer',$context,$query,'cards'); $board=$switcher->reproject($open,'board',$context);
        self::assertSame(1,$adapter->calls); self::assertSame($open->source,$board->source); self::assertSame($open->query->fingerprint(),$board->query->fingerprint());
    }
}

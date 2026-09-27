<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Interaction\InteractionEngineGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Interaction\InteractionPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Interaction\InteractionRenderMode;
use App\Extensions\TitanInterfaceRuntime\System\Interaction\InteractionSnapshot;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ArrayComponentVocabulary;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationComponentPolicy;
use PHPUnit\Framework\TestCase;

final class InteractionEngineAdapterTest extends TestCase
{
    public function test_same_session_renders_in_three_modes_without_gaining_execution_authority(): void
    {
        $snapshot=new InteractionSnapshot('session-1','wizard-1','in_progress','Next step',['actions'=>['submit'],'offline_mode'=>'offline_queueable','progress'=>['percentage'=>25]],['id'=>'step-1'],0);
        $gateway=new class($snapshot) implements InteractionEngineGatewayContract {
            public function __construct(private InteractionSnapshot $snapshot){}
            public function available():bool{return true;}
            public function session(InterfaceContext $context,string $sessionId):InteractionSnapshot{return $this->snapshot;}
            public function health():array{return['available'=>true];}
        };
        $vocab=new ArrayComponentVocabulary([
            'chat-thread'=>['id'=>'chat-thread','authority'=>'presentation-only','responsive'=>true,'accessible'=>true],
            'stack'=>['id'=>'stack','authority'=>'presentation-only','responsive'=>true,'accessible'=>true],
            'form-wizard'=>['id'=>'form-wizard','authority'=>'presentation-only','responsive'=>true,'accessible'=>true],
        ]);
        $adapter=new InteractionPresentationAdapter($gateway,new BuilderPresentationAdapter($vocab,new PresentationComponentPolicy()));
        $context=new InterfaceContext(7,11,'command','work');
        $modes=[InteractionRenderMode::CHAT,InteractionRenderMode::PANEL,InteractionRenderMode::FULL_WORKSPACE];
        $presentations=array_map(fn(string $m)=>$adapter->render($context,'session-1',$m),$modes);
        self::assertCount(1,array_unique(array_map(fn($p)=>$p->snapshotFingerprint,$presentations)));
        foreach($presentations as$p){self::assertSame('session-1',$p->jsonSerialize()['resume_key']);self::assertFalse($p->jsonSerialize()['interaction']['actions'][0]['executable']);}
    }
}

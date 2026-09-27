<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Governance\GovernancePayloadNormalizer;
use PHPUnit\Framework\TestCase;

final class GovernanceTrustLifecycleTest extends TestCase
{
    public function test_governance_normalizer_keeps_authoritative_trust_layers_distinct(): void
    {
        $state=(new GovernancePayloadNormalizer())->normalize([
            'status'=>'approval_required',
            'proposal'=>['id'=>'p1','title'=>'Change assignment','summary'=>'Reassign worker','change_summary'=>['A → B']],
            'risk'=>['level'=>'red','status'=>'assessed','reasons'=>['capacity'],'source_ref'=>'titan-risk'],
            'assurance'=>['status'=>'verified','level'=>'standard','confidence'=>0.91,'source_ref'=>'titan-assurance'],
            'autonomy'=>['level'=>'assist','status'=>'bounded','policy_ref'=>'p2','source_ref'=>'titan-autonomy'],
            'approval'=>['required'=>true,'status'=>'pending','approval_id'=>'a1','source_ref'=>'titan-ai'],
            'execution'=>['status'=>'not_started'],
            'rollback'=>['available'=>false,'status'=>'unavailable'],
            'provenance'=>['authority'=>'titan-ai'],
        ]);
        self::assertSame('approval_required',$state['status']);
        self::assertSame('high',$state['risk']['level']);
        self::assertSame('verified',$state['assurance']['status']);
        self::assertSame('assist',$state['autonomy']['level']);
        self::assertSame('pending',$state['approval']['status']);
        self::assertNull($state['receipt']);
    }
}

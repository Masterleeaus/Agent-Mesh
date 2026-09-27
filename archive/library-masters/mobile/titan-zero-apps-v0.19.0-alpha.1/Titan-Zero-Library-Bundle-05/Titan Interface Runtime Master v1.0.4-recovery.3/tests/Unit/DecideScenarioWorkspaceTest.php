<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Decision\DecisionPayloadNormalizer;
use PHPUnit\Framework\TestCase;

final class DecideScenarioWorkspaceTest extends TestCase
{
    public function test_normalizer_keeps_observations_recommendations_and_scenarios_separate():void
    {
        $result=(new DecisionPayloadNormalizer())->normalize([
            'observations'=>[['key'=>'load','label'=>'Load','value'=>'High']],
            'recommendations'=>[['key'=>'r1','label'=>'Prefer B','summary'=>'Lower risk','confidence'=>0.8,'scenario_ref'=>'b']],
            'scenarios'=>[['key'=>'b','label'=>'B','recommended'=>true,'outcomes'=>[['key'=>'cost','label'=>'Cost','value'=>12]],'consequences'=>['Higher cost']]],
            'assumptions'=>[['key'=>'crew','label'=>'Crew','value'=>2,'editable'=>true]],
        ]);
        self::assertSame('load',$result['observations'][0]['key']);
        self::assertSame('r1',$result['recommendations'][0]['key']);
        self::assertSame('b',$result['scenarios'][0]['key']);
        self::assertSame('crew',$result['assumptions'][0]['key']);
    }
}

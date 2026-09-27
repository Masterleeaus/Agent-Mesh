<?php

declare(strict_types=1);
namespace App\Extensions\TitanHub\System\Health;

use App\Extensions\TitanHub\System\Contracts\CustomerOperationsGateway;
use App\Extensions\TitanHub\System\Contracts\HubPresentationBridge;
use Illuminate\Contracts\Foundation\Application;
use App\Extensions\TitanHub\System\Integration\HubSuiteReadiness;

final class HubHealthCheck
{
    public function __construct(private Application $app, private HubSuiteReadiness $suite){}
    public function report():array
    {
        $suite=$this->suite->report();
        $local=$this->app->bound(CustomerOperationsGateway::class)&&$this->app->bound(HubPresentationBridge::class);
        return [
            'extension'=>'titan-hub','surface'=>'hub','status'=>($local&&($suite['ready']??false))?'ok':'degraded',
            'contracts'=>[
                'customer_operations'=>$this->app->bound(CustomerOperationsGateway::class),
                'presentation'=>$this->app->bound(HubPresentationBridge::class),
            ],
            'suite'=>$suite,
            'optional'=>[
                'interaction_engine'=>$this->anyBound(['App\\Extensions\\InteractionEngine\\System\\Contracts\\PublicInteractionEngineInterface']),
                'interface_runtime'=>$this->anyBound(['App\\Extensions\\TitanInterfaceRuntime\\System\\Contracts\\InterfaceRuntime','App\\Extensions\\InterfaceRuntime\\System\\Contracts\\InterfaceRuntime']),
                'visual_runtime'=>$this->anyBound(['App\\Extensions\\TitanVisualRuntime\\System\\Contracts\\VisualRuntime']),
            ],
        ];
    }
    private function anyBound(array $ids):bool{foreach($ids as$id){if((class_exists($id)||interface_exists($id))&&$this->app->bound($id))return true;}return false;}
}

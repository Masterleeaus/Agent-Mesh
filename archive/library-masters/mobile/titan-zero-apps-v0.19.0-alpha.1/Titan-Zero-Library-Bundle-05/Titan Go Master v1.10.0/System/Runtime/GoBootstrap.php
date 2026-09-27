<?php

declare(strict_types=1);

namespace App\Extensions\TitanGo\System\Runtime;

use App\Extensions\TitanGo\System\Contracts\GoRuntimeBridgeInterface;
use App\Extensions\TitanGo\System\Contracts\TitanFieldMobileGatewayInterface;
use App\Extensions\TitanGo\System\Contracts\GoSuiteRuntimeInterface;
use App\Extensions\TitanAppsCore\System\Contracts\AppPwaLifecycle;
use App\Extensions\TitanAppsCore\System\Contracts\AppSurface;
use App\Extensions\TitanGo\System\Navigation\GoNavigation;

final class GoBootstrap
{
    public function __construct(
        private GoRuntimeBridgeInterface $bridge,
        private TitanFieldMobileGatewayInterface $field,
        private GoRuntimeReadiness $readiness,
        private GoNavigation $navigation,
        private GoSuiteRuntimeInterface $suiteRuntime,
        private AppPwaLifecycle $pwaLifecycle
    ) {}

    public function describe(): array
    {
        return [
            'schema' => 'titan.apps.go.bootstrap.v1',
            'surface' => 'go',
            'runtime' => $this->readiness->report(),
            'suite_wiring' => $this->suiteRuntime->diagnostics(),
            'pwa' => $this->pwaLifecycle->policy(AppSurface::Go),
            'contracts' => [
                'interaction' => $this->bridge->interactionContract(),
                'interface' => $this->bridge->interfaceRuntimeContract(),
                'visual' => $this->bridge->visualRuntimeContract(),
                'builder' => $this->bridge->builderContract(),
            ],
            'navigation' => $this->navigation->items(),
            'field_provider' => [
                'context_route' => $this->field->contextRoute(),
                'register_device_route' => $this->field->registerDeviceRoute(),
                'replay_route' => $this->field->replayRoute(),
                'sync_route' => $this->field->syncRoute(),
                'evidence_route' => $this->field->evidenceRoute(),
                'max_batch_size' => $this->field->maxBatchSize(),
            ],
            'authority' => [
                'business_truth' => 'provider',
                'actions' => 'governed_intents',
                'raw_domain_records' => false,
                'company_boundary' => 'company_id',
            ],
        ];
    }
}

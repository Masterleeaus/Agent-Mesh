<?php

declare(strict_types=1);

namespace App\Extensions\TitanGo\System\Runtime;

use App\Extensions\InteractionEngine\System\Contracts\InteractionContextFactoryInterface;
use App\Extensions\InteractionEngine\System\Contracts\PublicInteractionEngineInterface;
use App\Extensions\TitanAppsCore\System\Contracts\AppPwaLifecycle;
use App\Extensions\TitanAppsCore\System\Services\TitanAppsApplicationRegistry;
use App\Extensions\TitanAppsCore\System\Services\TitanAppsPublicServiceRegistry;
use App\Extensions\TitanAppsCore\System\Services\TitanAppsRuntimeDependencyRegistry;
use App\Extensions\TitanGo\System\Contracts\GoProjectionPolicy;
use App\Extensions\TitanGo\System\Contracts\GoSuiteRuntimeInterface;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\InterfaceRuntime;
use App\Extensions\TitanInterfaceRuntime\System\Value\InterfaceContext;
use Illuminate\Contracts\Container\Container;

final class GoSuiteRuntime implements GoSuiteRuntimeInterface
{
    public function __construct(private Container $container) {}

    public function diagnostics(): array
    {
        $contracts = [
            'core.application_registry' => TitanAppsApplicationRegistry::class,
            'core.public_services' => TitanAppsPublicServiceRegistry::class,
            'core.runtime_dependencies' => TitanAppsRuntimeDependencyRegistry::class,
            'core.pwa_lifecycle' => AppPwaLifecycle::class,
            'interaction.public' => PublicInteractionEngineInterface::class,
            'interaction.context_factory' => InteractionContextFactoryInterface::class,
            'interface.runtime' => InterfaceRuntime::class,
            'visual.runtime' => 'App\\Extensions\\TitanVisualRuntime\\System\\Contracts\\VisualRuntime',
            'builder.surface_registry' => 'App\\Extensions\\TitanBuilder\\System\\Contracts\\SurfaceRegistry',
        ];

        $bindings = [];
        foreach ($contracts as $id => $contract) {
            $bindings[$id] = [
                'contract' => $contract,
                'bound' => $this->container->bound($contract),
                'required' => !str_starts_with($id, 'builder.'),
            ];
        }

        $goRegistered = false;
        $coreDependencies = [];
        $publicServices = [];
        if ($this->container->bound(TitanAppsApplicationRegistry::class)) {
            try {
                $goRegistered = $this->container->make(TitanAppsApplicationRegistry::class)->get('go')->surface()->value === 'go';
            } catch (\Throwable) {
                $goRegistered = false;
            }
        }
        if ($this->container->bound(TitanAppsRuntimeDependencyRegistry::class)) {
            $coreDependencies = $this->container->make(TitanAppsRuntimeDependencyRegistry::class)->readiness();
        }
        if ($this->container->bound(TitanAppsPublicServiceRegistry::class)) {
            $publicServices = $this->container->make(TitanAppsPublicServiceRegistry::class)->catalogue();
        }

        $requiredReady = $goRegistered;
        foreach ($bindings as $binding) {
            if ($binding['required'] && !$binding['bound']) {
                $requiredReady = false;
            }
        }

        return [
            'schema' => 'titan.apps.go.suite-wiring.v1',
            'surface' => 'go',
            'company_boundary' => 'company_id',
            'ready' => $requiredReady,
            'mode' => $requiredReady ? 'suite-runtime' : 'degraded-shell',
            'go_registered_in_core' => $goRegistered,
            'bindings' => $bindings,
            'core_runtime_dependencies' => $coreDependencies,
            'public_services' => $publicServices,
        ];
    }

    public function presentationIntent(
        string $companyId,
        string $actorId,
        string $intent,
        array $facts = [],
        array $roles = [],
        array $capabilities = [],
        array $metadata = []
    ): array {
        $companyId = $this->requireIdentity($companyId, 'company_id');
        $actorId = $this->requireIdentity($actorId, 'actor_id');
        $this->assertNoLegacyTenantAuthority($metadata);

        /** @var InteractionContextFactoryInterface $factory */
        $factory = $this->container->make(InteractionContextFactoryInterface::class);
        /** @var PublicInteractionEngineInterface $interaction */
        $interaction = $this->container->make(PublicInteractionEngineInterface::class);

        $context = $factory->make($companyId, $actorId, 'go', null, null, $roles, $capabilities, $metadata);
        return $interaction->presentationIntent($context, $intent, $facts)->toArray();
    }

    public function render(
        string $companyId,
        string $actorId,
        array $spec,
        array $projection = [],
        array $permissions = [],
        array $device = [],
        array $connectivity = [],
        array $presentation = []
    ): array {
        $companyId = $this->requireIdentity($companyId, 'company_id');
        $actorId = $this->requireIdentity($actorId, 'actor_id');
        GoProjectionPolicy::assertProjection($projection);
        $this->assertNoLegacyTenantAuthority($presentation);

        /** @var InterfaceRuntime $runtime */
        $runtime = $this->container->make(InterfaceRuntime::class);
        $result = $runtime->execute($spec, new InterfaceContext(
            'go',
            null,
            $companyId,
            $actorId,
            $permissions,
            $projection,
            $device,
            $connectivity,
            $presentation,
        ));

        return [
            'schema' => 'titan.apps.go.render-result.v1',
            'surface' => 'go',
            'company_id' => $companyId,
            'tree' => $result->tree,
            'repairs' => $result->repairs,
            'fallback' => $result->fallback,
        ];
    }

    private function requireIdentity(string $value, string $field): string
    {
        $value = trim($value);
        if ($value === '') {
            throw new \InvalidArgumentException('Titan Go requires '.$field.'.');
        }
        return $value;
    }

    private function assertNoLegacyTenantAuthority(array $payload): void
    {
        $stack = [$payload];
        while ($stack !== []) {
            $current = array_pop($stack);
            foreach ($current as $key => $value) {
                $normal = strtolower((string) preg_replace('/[^a-z0-9]/i', '', (string) $key));
                if (in_array($normal, ['tenantid', 'tenantcompanyid', 'tenantscope', 'tenantboundary'], true)) {
                    throw new \InvalidArgumentException('Titan Go accepts company_id as the sole tenant/company boundary.');
                }
                if (is_array($value)) {
                    $stack[] = $value;
                }
            }
        }
    }
}

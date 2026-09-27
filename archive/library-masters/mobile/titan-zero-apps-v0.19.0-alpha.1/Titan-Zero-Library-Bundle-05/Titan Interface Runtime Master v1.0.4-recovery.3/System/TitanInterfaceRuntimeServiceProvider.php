<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System;

use App\Domains\Marketplace\Contracts\ExtensionRegisterKeyProviderInterface;
use App\Domains\Marketplace\Contracts\UninstallExtensionServiceProviderInterface;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\ProductSurface\ProductSurfacePolicyContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\ProductSurface\ProductSurfacePolicyProjectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Experience\FocusWorkspacePolicyContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Experience\AttentionHudProjectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Experience\GuidanceOverlayProjectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Experience\FocusWorkspacePolicy;
use App\Extensions\TitanInterfaceRuntime\System\Experience\AttentionHudProjector;
use App\Extensions\TitanInterfaceRuntime\System\Experience\GuidanceOverlayProjector;
use App\Extensions\TitanInterfaceRuntime\System\ProductSurface\ProductSurfacePolicy;
use App\Extensions\TitanInterfaceRuntime\System\ProductSurface\ProductSurfacePolicyProjector;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Collection\CollectionViewPreferenceStoreContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Collection\CollectionViewSwitcherContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Spatial\SpatialWorkspaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Decision\DecisionProviderGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Decision\DecisionWorkspaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Governance\GovernanceStateGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Governance\GovernanceWorkspaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Receipts\ReceiptPresenterContract;
use App\Extensions\TitanInterfaceRuntime\System\Collection\CollectionViewSwitcher;
use App\Extensions\TitanInterfaceRuntime\System\Collection\LaravelSessionCollectionViewPreferenceStore;
use App\Extensions\TitanInterfaceRuntime\System\Spatial\SpatialWorkspaceComposer;
use App\Extensions\TitanInterfaceRuntime\System\Decision\ContainerDecisionProviderGateway;
use App\Extensions\TitanInterfaceRuntime\System\Decision\DecisionWorkspaceComposer;
use App\Extensions\TitanInterfaceRuntime\System\Governance\ContainerGovernanceStateGateway;
use App\Extensions\TitanInterfaceRuntime\System\Governance\GovernanceHandoffResolver;
use App\Extensions\TitanInterfaceRuntime\System\Governance\GovernancePayloadNormalizer;
use App\Extensions\TitanInterfaceRuntime\System\Governance\GovernanceWorkspaceComposer;
use App\Extensions\TitanInterfaceRuntime\System\Governance\TitanAIGovernanceStateProvider;
use App\Extensions\TitanInterfaceRuntime\System\Receipts\GovernanceReceiptPresenter;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\AuthenticatedContextPrincipalProviderContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextResolverContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextStoreContract;
use App\Extensions\TitanInterfaceRuntime\System\Context\InMemoryInterfaceContextStore;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContextResolver;
use App\Extensions\TitanInterfaceRuntime\System\Context\LaravelAuthenticatedContextPrincipalProvider;
use App\Extensions\TitanInterfaceRuntime\System\Http\Middleware\BindInterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Discovery\InterfaceContributionDiscoveryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\InterfaceContributionRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\DomainRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\FacetRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ViewRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\LegacyDataSurfaceRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\GlobalWorkRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ActionRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\DecisionProviderRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Inspector\ContextInspectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Command\CommandSurfaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\ReadCacheContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\ReadAuthorityRouterContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\CapabilityReadGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Data\DataModeProjectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Data\LegacyRouteLocatorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Workspace\ObjectWorkspaceComposerContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Navigation\NavigationProjectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Presentation\ComponentVocabularyContract;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationComponentPolicy;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\TitanBuilderComponentVocabulary;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\TitanInterfaceRuntimeManagerContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Interaction\InteractionEngineGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\GlobalWork\GlobalWorkProviderGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\GlobalWork\GlobalWorkTrayAggregatorContract;
use App\Extensions\TitanInterfaceRuntime\System\Interaction\InteractionPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Interaction\TitanInteractionEngineGateway;
use App\Extensions\TitanInterfaceRuntime\System\Discovery\InterfaceContributionDiscovery;
use App\Extensions\TitanInterfaceRuntime\System\Discovery\InterfaceContributionValidator;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryInterfaceContributionRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryDomainRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryObjectRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryFacetRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryViewRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryLegacyDataSurfaceRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryGlobalWorkRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryActionRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryDecisionProviderRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorizedViewReader;
use App\Extensions\TitanInterfaceRuntime\System\Authority\InMemoryReadCache;
use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadAuthorityRouter;
use App\Extensions\TitanInterfaceRuntime\System\Authority\ContainerReadModelAuthorityAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Authority\CapabilityReadAuthorityAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Authority\LegacyRouteReadAuthorityAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Authority\NullCapabilityReadGateway;
use App\Extensions\TitanInterfaceRuntime\System\Data\DataModeProjector;
use App\Extensions\TitanInterfaceRuntime\System\Data\LaravelLegacyRouteLocator;
use App\Extensions\TitanInterfaceRuntime\System\Workspace\ObjectWorkspaceComposer;
use App\Extensions\TitanInterfaceRuntime\System\Navigation\RegistryNavigationProjector;
use App\Extensions\TitanInterfaceRuntime\System\Services\TitanInterfaceRuntimeManager;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\ContainerGlobalWorkProviderGateway;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkTrayAggregator;
use App\Extensions\TitanInterfaceRuntime\System\Inspector\ContextInspector;
use App\Extensions\TitanInterfaceRuntime\System\Command\CommandSurface;
use App\Extensions\TitanInterfaceRuntime\System\Host\TitanHostAuthorizationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Host\TitanHostMenuCompatibilityAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Operations\RuntimeOperationalState;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\WorkingSet\WorkingSetGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\WorkingSet\WorkingSetDomainItemVerifierContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\WorkingSet\WorkingSetWorkspaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Configuration\ConfigurationLifecycleWorkspaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Offline\OfflineSyncWorkspaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Configuration\ConfigurationLifecycleWorkspaceComposer;
use App\Extensions\TitanInterfaceRuntime\System\Configuration\ConfigurationPayloadNormalizer;
use App\Extensions\TitanInterfaceRuntime\System\Offline\OfflineSyncWorkspaceComposer;
use App\Extensions\TitanInterfaceRuntime\System\Offline\TitanInteractionOfflineSyncProvider;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\AccessibilityAuditor;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ResponsiveAuditor;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\LocalizationPolicy;
use App\Extensions\TitanInterfaceRuntime\System\Performance\PresentationCache;
use App\Extensions\TitanInterfaceRuntime\System\Performance\PresentationPerformanceGuard;
use App\Extensions\TitanInterfaceRuntime\System\Performance\PresentationQualityGate;
use App\Extensions\TitanInterfaceRuntime\System\WorkingSet\TitanWorkspaceProjectGateway;
use App\Extensions\TitanInterfaceRuntime\System\WorkingSet\HostTitanAssistWorkingSetItemVerifier;
use App\Extensions\TitanInterfaceRuntime\System\WorkingSet\WorkingSetWorkspaceComposer;
use App\Extensions\TitanInterfaceRuntime\System\Http\Middleware\EnsureInterfaceRuntimeReady;
use App\Extensions\TitanInterfaceRuntime\System\Actions\{UnavailableActionIntentDispatcher,InteractionEngineActionIntentDispatcher};
use App\Extensions\TitanInterfaceRuntime\System\Catalogue\{FallbackBuilderCatalogue,InstalledBuilderCatalogue};
use App\Extensions\TitanInterfaceRuntime\System\Contracts\ActionIntentDispatcher;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\BuilderCatalogue;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\InterfaceContributionRegistry as SemanticInterfaceContributionRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\InterfaceRuntime as SemanticInterfaceRuntimeContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\VisualRuntimeBridge;
use App\Extensions\TitanInterfaceRuntime\System\Health\InterfaceRuntimeHealthCheck;
use App\Extensions\TitanInterfaceRuntime\System\Registry\SemanticInterfaceContributionRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Runtime\SemanticInterfaceRuntime;
use App\Extensions\TitanInterfaceRuntime\System\Security\GeneratedSpecGuard;
use App\Extensions\TitanInterfaceRuntime\System\Security\ProjectionGuard;
use App\Extensions\TitanInterfaceRuntime\System\Surface\{CanonicalSurfaceResolver,MatureProductSurfaceCompatibility};
use App\Extensions\TitanInterfaceRuntime\System\Visual\{PassThroughVisualRuntimeBridge,InstalledVisualRuntimeBridge};
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\File;
use Illuminate\Support\ServiceProvider;

final class TitanInterfaceRuntimeServiceProvider extends ServiceProvider implements
    ExtensionRegisterKeyProviderInterface,
    UninstallExtensionServiceProviderInterface
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/titan-interface-runtime.php', 'titan-interface-runtime');

        // Canonical Titan Apps semantic runtime. The mature v1.0 registry/runtime graph above remains
        // available as a compatibility path; these bindings do not replace its discovery contracts.
        $this->app->singleton(SemanticInterfaceContributionRegistryContract::class, SemanticInterfaceContributionRegistry::class);
        $this->app->singleton(FallbackBuilderCatalogue::class);
        $this->app->singleton(PassThroughVisualRuntimeBridge::class);
        $this->app->singleton(UnavailableActionIntentDispatcher::class);
        $this->app->singleton(BuilderCatalogue::class, InstalledBuilderCatalogue::class);
        $this->app->singleton(VisualRuntimeBridge::class, InstalledVisualRuntimeBridge::class);
        $this->app->singleton(ActionIntentDispatcher::class, InteractionEngineActionIntentDispatcher::class);
        $this->app->singleton(GeneratedSpecGuard::class);
        $this->app->singleton(ProjectionGuard::class);
        $this->app->singleton(CanonicalSurfaceResolver::class);
        $this->app->singleton(MatureProductSurfaceCompatibility::class);
        $this->app->singleton(SemanticInterfaceRuntimeContract::class, static fn ($app): SemanticInterfaceRuntime => new SemanticInterfaceRuntime(
            $app->make(GeneratedSpecGuard::class),
            $app->make(ProjectionGuard::class),
            $app->make(BuilderCatalogue::class),
            $app->make(VisualRuntimeBridge::class),
            $app->make(CanonicalSurfaceResolver::class),
            $app->make(SemanticInterfaceContributionRegistryContract::class),
        ));
        $this->app->singleton(InterfaceRuntimeHealthCheck::class);

        $this->app->singleton(TitanHostAuthorizationAdapter::class);
        $this->app->singleton(TitanHostMenuCompatibilityAdapter::class);
        $this->app->singleton(RuntimeOperationalState::class);
        $this->app->singleton(ProductSurfacePolicyContract::class, ProductSurfacePolicy::class);
        $this->app->singleton(FocusWorkspacePolicyContract::class, FocusWorkspacePolicy::class);
        $this->app->singleton(GuidanceOverlayProjectorContract::class, GuidanceOverlayProjector::class);
        $this->app->scoped(ProductSurfacePolicyProjectorContract::class, static fn ($app): ProductSurfacePolicyProjector => new ProductSurfacePolicyProjector(
            $app->make(ProductSurfacePolicyContract::class),
            $app->make(DomainRegistryContract::class),
            $app->make(ObjectRegistryContract::class),
            $app->make(FacetRegistryContract::class),
            $app->make(ViewRegistryContract::class),
            $app->make(ActionRegistryContract::class),
        ));

        $this->app->singleton(
            TitanInterfaceRuntimeManagerContract::class,
            TitanInterfaceRuntimeManager::class,
        );

        $this->app->singleton(
            InterfaceContributionRegistryContract::class,
            InMemoryInterfaceContributionRegistry::class,
        );

        $this->app->singleton(DomainRegistryContract::class, InMemoryDomainRegistry::class);
        $this->app->singleton(ObjectRegistryContract::class, InMemoryObjectRegistry::class);
        $this->app->singleton(FacetRegistryContract::class, static fn ($app): InMemoryFacetRegistry => new InMemoryFacetRegistry($app->make(ObjectRegistryContract::class)));
        $this->app->singleton(ViewRegistryContract::class, static fn ($app): InMemoryViewRegistry => new InMemoryViewRegistry($app->make(ObjectRegistryContract::class)));
        $this->app->singleton(LegacyDataSurfaceRegistryContract::class, static fn ($app): InMemoryLegacyDataSurfaceRegistry => new InMemoryLegacyDataSurfaceRegistry($app->make(ObjectRegistryContract::class)));
        $this->app->singleton(GlobalWorkRegistryContract::class, InMemoryGlobalWorkRegistry::class);
        $this->app->singleton(ActionRegistryContract::class, static fn ($app): InMemoryActionRegistry => new InMemoryActionRegistry($app->make(ObjectRegistryContract::class)));
        $this->app->singleton(DecisionProviderRegistryContract::class, static fn ($app): InMemoryDecisionProviderRegistry => new InMemoryDecisionProviderRegistry($app->make(ObjectRegistryContract::class), $app->make(ActionRegistryContract::class)));
        $this->app->singleton(ObjectWorkspaceComposerContract::class, ObjectWorkspaceComposer::class);

        $this->app->singleton(LegacyRouteLocatorContract::class, LaravelLegacyRouteLocator::class);
        $this->app->singleton(CapabilityReadGatewayContract::class, NullCapabilityReadGateway::class);
        $this->app->singleton(ContainerReadModelAuthorityAdapter::class);
        $this->app->singleton(CapabilityReadAuthorityAdapter::class);
        $this->app->singleton(LegacyRouteReadAuthorityAdapter::class, static fn ($app): LegacyRouteReadAuthorityAdapter => new LegacyRouteReadAuthorityAdapter(
            $app->make(LegacyRouteLocatorContract::class),
            (bool) config('titan-interface-runtime.legacy_data.allow_hub', false),
        ));
        $this->app->scoped(ReadCacheContract::class, InMemoryReadCache::class);
        $this->app->scoped(ReadAuthorityRouterContract::class, static fn ($app): ReadAuthorityRouter => new ReadAuthorityRouter([
            $app->make(ContainerReadModelAuthorityAdapter::class),
            $app->make(CapabilityReadAuthorityAdapter::class),
            $app->make(LegacyRouteReadAuthorityAdapter::class),
        ], $app->make(ReadCacheContract::class)));
        $this->app->scoped(AuthorizedViewReader::class, static fn ($app): AuthorizedViewReader => new AuthorizedViewReader(
            $app->make(ViewRegistryContract::class),
            $app->make(ReadAuthorityRouterContract::class),
        ));
        $this->app->scoped(DataModeProjectorContract::class, static fn ($app): DataModeProjector => new DataModeProjector(
            $app->make(LegacyDataSurfaceRegistryContract::class),
            $app->make(LegacyRouteLocatorContract::class),
            (array) config('titan-interface-runtime.legacy_data.product_surfaces', ['command', 'go', 'onboarding']),
            $app->make(ObjectRegistryContract::class),
        ));
        $this->app->singleton(NavigationProjectorContract::class, RegistryNavigationProjector::class);

        $this->app->singleton(
            ComponentVocabularyContract::class,
            static fn ($app): TitanBuilderComponentVocabulary => new TitanBuilderComponentVocabulary($app),
        );
        $this->app->singleton(PresentationComponentPolicy::class);
        $this->app->singleton(BuilderPresentationAdapter::class);

        $this->app->scoped(CollectionViewPreferenceStoreContract::class, static function ($app): LaravelSessionCollectionViewPreferenceStore {
            $session = null;
            try {
                $request = $app['request'];
                if (method_exists($request, 'hasSession') && $request->hasSession()) $session = $request->session();
            } catch (\Throwable) {}
            return new LaravelSessionCollectionViewPreferenceStore($session);
        });
        $this->app->scoped(CollectionViewSwitcherContract::class, static fn ($app): CollectionViewSwitcher => new CollectionViewSwitcher(
            $app->make(ViewRegistryContract::class),
            $app->make(AuthorizedViewReader::class),
            $app->make(BuilderPresentationAdapter::class),
            $app->make(CollectionViewPreferenceStoreContract::class),
        ));

        $this->app->scoped(SpatialWorkspaceContract::class, static fn ($app): SpatialWorkspaceComposer => new SpatialWorkspaceComposer(
            $app->make(ObjectRegistryContract::class),
            $app->make(ViewRegistryContract::class),
            $app->make(ActionRegistryContract::class),
            $app->make(AuthorizedViewReader::class),
            $app->make(BuilderPresentationAdapter::class),
        ));

        $this->app->singleton(DecisionProviderGatewayContract::class, static fn ($app): ContainerDecisionProviderGateway => new ContainerDecisionProviderGateway($app));
        $this->app->scoped(DecisionWorkspaceContract::class, static fn ($app): DecisionWorkspaceComposer => new DecisionWorkspaceComposer(
            $app->make(ObjectRegistryContract::class),
            $app->make(ViewRegistryContract::class),
            $app->make(ActionRegistryContract::class),
            $app->make(DecisionProviderRegistryContract::class),
            $app->make(DecisionProviderGatewayContract::class),
            $app->make(AuthorizedViewReader::class),
            $app->make(BuilderPresentationAdapter::class),
        ));


        $this->app->singleton(GovernancePayloadNormalizer::class);
        $this->app->singleton(GovernanceHandoffResolver::class);
        $this->app->singleton(ReceiptPresenterContract::class, GovernanceReceiptPresenter::class);
        $this->app->singleton('titan.interface.governance', static fn ($app): TitanAIGovernanceStateProvider => new TitanAIGovernanceStateProvider($app));
        $this->app->singleton(GovernanceStateGatewayContract::class, static fn ($app): ContainerGovernanceStateGateway => new ContainerGovernanceStateGateway($app));

        $this->app->singleton(WorkingSetGatewayContract::class, static fn (): TitanWorkspaceProjectGateway => new TitanWorkspaceProjectGateway(
            (int) config('titan-interface-runtime.working_sets.max_items', 200),
        ));
        $this->app->singleton(WorkingSetDomainItemVerifierContract::class, static fn ($app): HostTitanAssistWorkingSetItemVerifier => new HostTitanAssistWorkingSetItemVerifier(
            $app,
            (array) config('titan-interface-runtime.working_sets.domain_verifier', []),
        ));
        $this->app->scoped(WorkingSetWorkspaceContract::class, static fn ($app): WorkingSetWorkspaceComposer => new WorkingSetWorkspaceComposer(
            $app->make(WorkingSetGatewayContract::class),
            $app->make(WorkingSetDomainItemVerifierContract::class),
            $app->make(ObjectRegistryContract::class),
            $app->make(BuilderPresentationAdapter::class),
            (array) config('titan-interface-runtime.working_sets.object_type_map', []),
            (array) config('titan-interface-runtime.working_sets.user_scoped_types', ['file','photo','chat','workbook']),
            (int) config('titan-interface-runtime.working_sets.max_items', 200),
        ));

        $this->app->singleton(ConfigurationPayloadNormalizer::class);
        $this->app->scoped(ConfigurationLifecycleWorkspaceContract::class, static fn ($app): ConfigurationLifecycleWorkspaceComposer => new ConfigurationLifecycleWorkspaceComposer(
            $app->make(ObjectRegistryContract::class),
            $app->make(ViewRegistryContract::class),
            $app->make(ActionRegistryContract::class),
            $app->make(AuthorizedViewReader::class),
            $app->make(BuilderPresentationAdapter::class),
            $app->make(ConfigurationPayloadNormalizer::class),
        ));

        $this->app->scoped(GovernanceWorkspaceContract::class, static fn ($app): GovernanceWorkspaceComposer => new GovernanceWorkspaceComposer(
            $app->make(ObjectRegistryContract::class),
            $app->make(ActionRegistryContract::class),
            $app->make(GovernanceStateGatewayContract::class),
            $app->make(BuilderPresentationAdapter::class),
            $app->make(GovernancePayloadNormalizer::class),
            $app->make(GovernanceHandoffResolver::class),
            $app->make(ReceiptPresenterContract::class),
        ));

        $this->app->singleton(
            InteractionEngineGatewayContract::class,
            static fn ($app): TitanInteractionEngineGateway => new TitanInteractionEngineGateway(
                $app,
                (array) config('titan-interface-runtime.interaction_engine.surface_map', [
                    'command' => 'bos', 'go' => 'field', 'hub' => 'customer', 'onboarding' => 'core',
                ]),
            ),
        );
        $this->app->scoped(InteractionPresentationAdapter::class, static fn ($app): InteractionPresentationAdapter => new InteractionPresentationAdapter(
            $app->make(InteractionEngineGatewayContract::class),
            $app->make(BuilderPresentationAdapter::class),
        ));

        $this->app->singleton('titan.interface.global-work.titan-interface-runtime.interaction-engine-sync', static fn ($app): TitanInteractionOfflineSyncProvider => new TitanInteractionOfflineSyncProvider($app));
        $this->app->singleton(GlobalWorkProviderGatewayContract::class, ContainerGlobalWorkProviderGateway::class);
        $this->app->scoped(GlobalWorkTrayAggregatorContract::class, static fn ($app): GlobalWorkTrayAggregator => new GlobalWorkTrayAggregator(
            $app->make(GlobalWorkRegistryContract::class),
            $app->make(GlobalWorkProviderGatewayContract::class),
            (int) config('titan-interface-runtime.global_work.default_limit', 50),
        ));

        $this->app->scoped(AttentionHudProjectorContract::class, static fn ($app): AttentionHudProjector => new AttentionHudProjector(
            $app->make(GlobalWorkTrayAggregatorContract::class),
        ));

        $this->app->scoped(OfflineSyncWorkspaceContract::class, static fn ($app): OfflineSyncWorkspaceComposer => new OfflineSyncWorkspaceComposer(
            $app->make(GlobalWorkTrayAggregatorContract::class),
            $app->make(ActionRegistryContract::class),
        ));

        $this->app->singleton(AccessibilityAuditor::class);
        $this->app->singleton(ResponsiveAuditor::class);
        $this->app->singleton(LocalizationPolicy::class, static fn (): LocalizationPolicy => new LocalizationPolicy(
            (array) config('titan-interface-runtime.quality.supported_locales', ['en','en-AU']),
            (string) config('titan-interface-runtime.quality.default_locale', 'en-AU'),
        ));
        $this->app->scoped(PresentationCache::class, static fn (): PresentationCache => new PresentationCache((int) config('titan-interface-runtime.quality.presentation_cache_entries', 128)));
        $this->app->singleton(PresentationPerformanceGuard::class, static fn (): PresentationPerformanceGuard => new PresentationPerformanceGuard(
            (int) config('titan-interface-runtime.quality.max_payload_bytes', 524288),
            (int) config('titan-interface-runtime.quality.max_nodes', 2000),
            (int) config('titan-interface-runtime.quality.max_depth', 16),
            (float) config('titan-interface-runtime.quality.p95_presentation_ms', 100.0),
        ));
        $this->app->scoped(PresentationQualityGate::class);

        $this->app->scoped(ContextInspectorContract::class, static fn ($app): ContextInspector => new ContextInspector(
            $app->make(ObjectRegistryContract::class),
            $app->make(DomainRegistryContract::class),
            $app->make(ActionRegistryContract::class),
            $app->make(ObjectWorkspaceComposerContract::class),
            $app->make(BuilderPresentationAdapter::class),
        ));
        $this->app->scoped(CommandSurfaceContract::class, static fn ($app): CommandSurface => new CommandSurface(
            $app->make(DomainRegistryContract::class),
            $app->make(ContextInspectorContract::class),
            $app->make(BuilderPresentationAdapter::class),
            (int) config('titan-interface-runtime.command.default_limit', 30),
            (int) config('titan-interface-runtime.command.max_limit', 100),
        ));

        $this->app->singleton(
            AuthenticatedContextPrincipalProviderContract::class,
            LaravelAuthenticatedContextPrincipalProvider::class,
        );

        $this->app->scoped(InterfaceContextStoreContract::class, InMemoryInterfaceContextStore::class);

        $this->app->scoped(
            InterfaceContextResolverContract::class,
            static function ($app): InterfaceContextResolver {
                return new InterfaceContextResolver(
                    principalProvider: $app->make(AuthenticatedContextPrincipalProviderContract::class),
                    allowedProductSurfaces: (array) config('titan-interface-runtime.product_surfaces', ['command', 'go', 'hub', 'onboarding']),
                    defaultProductSurface: (string) config('titan-interface-runtime.context.default_product_surface', 'command'),
                    defaultDomain: (string) config('titan-interface-runtime.context.default_domain', 'platform'),
                );
            },
        );

        $this->app->singleton(InterfaceContributionValidator::class);

        $this->app->singleton(
            InterfaceContributionDiscoveryContract::class,
            static function ($app): InterfaceContributionDiscovery {
                return new InterfaceContributionDiscovery(
                    registry: $app->make(InterfaceContributionRegistryContract::class),
                    validator: $app->make(InterfaceContributionValidator::class),
                    extensionsRoot: (string) config('titan-interface-runtime.discovery.extensions_root', app_path('Extensions')),
                    supportedContractVersions: (array) config('titan-interface-runtime.discovery.supported_contract_versions', ['1.0','1.1']),
                );
            },
        );
    }

    public function boot(): void
    {
        $this->loadTranslationsFrom(__DIR__ . '/../resources/lang', 'titan-interface-runtime');
        $this->loadViewsFrom(__DIR__ . '/../resources/views', 'titan-interface-runtime');

        $this->publishes([
            __DIR__ . '/../config/titan-interface-runtime.php' => config_path('titan-interface-runtime.php'),
        ], 'extension');

        // Diagnostic routes remain available even when traffic is disabled/maintenance-gated.
        $this->registerRoutes();
        if (! $this->app->make(RuntimeOperationalState::class)->acceptsTraffic()) {
            return;
        }

        if ((bool) config('titan-interface-runtime.discovery.auto_discover', true)) {
            $this->app->make(InterfaceContributionDiscoveryContract::class)->discover();
        }

        $contributions = $this->app->make(InterfaceContributionRegistryContract::class)->all();
        $this->app->make(DomainRegistryContract::class)->rebuild($contributions);
        $this->app->make(ObjectRegistryContract::class)->rebuild($contributions);
        $this->app->make(FacetRegistryContract::class)->rebuild($contributions);
        $this->app->make(ViewRegistryContract::class)->rebuild($contributions);
        $this->app->make(LegacyDataSurfaceRegistryContract::class)->rebuild($contributions);
        $this->app->make(GlobalWorkRegistryContract::class)->rebuild($contributions);
        $this->app->make(ActionRegistryContract::class)->rebuild($contributions);
        $this->app->make(DecisionProviderRegistryContract::class)->rebuild($contributions);

        // Menu is a projection only. Registry first, legacy menus-table self-heal second.
        $this->app->make(TitanHostMenuCompatibilityAdapter::class)->sync();
    }

    public function registerKey(): string
    {
        return 'titan-interface-runtime';
    }

    public static function uninstall(): void
    {
        // Interface Runtime owns no business tables or durable domain state.
        try { app(TitanHostMenuCompatibilityAdapter::class)->remove(); } catch (\Throwable) {}
        File::delete(config_path('titan-interface-runtime.php'));
    }

    private function registerRoutes(): void
    {
        /** @var Router $router */
        $router = $this->app['router'];

        $router->group([
            'middleware' => ['web', 'auth', EnsureInterfaceRuntimeReady::class, BindInterfaceContext::class],
            'prefix' => 'dashboard/user/titan-interface-runtime',
            'as' => 'dashboard.user.titan.interface.runtime.',
        ], static function (Router $router): void {
            require __DIR__ . '/../routes/user.php';
        });

        $router->group([
            'middleware' => ['web', 'auth', 'admin'],
            'prefix' => 'dashboard/admin/titan-interface-runtime',
            'as' => 'dashboard.admin.titan.interface.runtime.',
        ], static function (Router $router): void {
            require __DIR__ . '/../routes/admin.php';
        });
    }
}

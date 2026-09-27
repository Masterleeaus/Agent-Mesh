<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System;

use App\Domains\Marketplace\Contracts\ExtensionRegisterKeyProviderInterface;
use App\Domains\Marketplace\Contracts\UninstallExtensionServiceProviderInterface;
use Illuminate\Routing\Router;
use Illuminate\Support\ServiceProvider;
use App\Extensions\InteractionEngine\System\Wizard\Storage\WizardSessionStoreInterface;
use App\Extensions\InteractionEngine\System\Wizard\Storage\CacheWizardSessionStore;
use App\Extensions\InteractionEngine\System\Wizard\Renderer\HybridRenderer;
use App\Extensions\InteractionEngine\System\Registry\InteractionRegistry;
use App\Extensions\InteractionEngine\System\Contracts\WorldModelInterface;
use App\Extensions\InteractionEngine\System\Contracts\InteractionEngineManagerContract;
use App\Extensions\InteractionEngine\System\Contracts\ExecutiveEngineInterface;
use App\Extensions\InteractionEngine\System\Contracts\CognitiveOrchestratorInterface;
use App\Extensions\InteractionEngine\System\Compiler\SchemaValidator;
use App\Extensions\InteractionEngine\System\Compiler\InteractionCompiler;
use App\Extensions\InteractionEngine\System\Compiler\FragmentResolver;
use App\Extensions\InteractionEngine\System\Compiler\ConditionRegistry;
use App\Extensions\InteractionEngine\System\AI\AIServiceInterface;
use App\Extensions\InteractionEngine\System\AI\LocalBrainGuidanceService;
use App\Extensions\InteractionEngine\System\AutoComplete\AutoCompleteEngine;
use App\Extensions\InteractionEngine\System\Command\CommandBus;
use App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEventStoreInterface;
use App\Extensions\InteractionEngine\System\Cognition\Events\EloquentCognitiveEventStore;
use App\Extensions\InteractionEngine\System\Cognition\Decision\DecisionRecorder;
use App\Extensions\InteractionEngine\System\Cognition\Observation\ObservationRecorder;
use App\Extensions\InteractionEngine\System\Cognition\Outcome\OutcomeRecorder;
use App\Extensions\InteractionEngine\System\Cognition\Outcome\OutcomeLinker;
use App\Extensions\InteractionEngine\System\Commands\CompileInteractionCommand;
use App\Extensions\InteractionEngine\System\Commands\HealthCheckCommand;
use App\Extensions\InteractionEngine\System\Commands\InstallCommand;
use App\Extensions\InteractionEngine\System\Commands\ListTemplatesCommand;
use App\Extensions\InteractionEngine\System\Commands\SeedCommand;
use App\Extensions\InteractionEngine\System\Commands\SyncInteractionCommand;
use App\Extensions\InteractionEngine\System\Context\ContextBuilder;
use App\Extensions\InteractionEngine\System\Context\ContextGraph;
use App\Extensions\InteractionEngine\System\Context\Providers\CustomerContextProvider;
use App\Extensions\InteractionEngine\System\Context\Providers\PolicyContextProvider;
use App\Extensions\InteractionEngine\System\Contracts\CommandBusInterface;
use App\Extensions\InteractionEngine\System\Contracts\ConflictResolverInterface;
use App\Extensions\InteractionEngine\System\Contracts\EventRecorderInterface;
use App\Extensions\InteractionEngine\System\Contracts\GeneratorInterface;
use App\Extensions\InteractionEngine\System\Contracts\HealerInterface;
use App\Extensions\InteractionEngine\System\Contracts\LearnerInterface;
use App\Extensions\InteractionEngine\System\Contracts\NavigationEngineInterface;
use App\Extensions\InteractionEngine\System\Contracts\OfflineQueueInterface;
use App\Extensions\InteractionEngine\System\Contracts\PolicyEngineInterface;
use App\Extensions\InteractionEngine\System\Contracts\PredictorInterface;
use App\Extensions\InteractionEngine\System\Contracts\QuestionResolverInterface;
use App\Extensions\InteractionEngine\System\Contracts\RendererInterface;
use App\Extensions\InteractionEngine\System\Contracts\StateManagerInterface;
use App\Extensions\InteractionEngine\System\Contracts\ValidationEngineInterface;
use App\Extensions\InteractionEngine\System\Event\EventRecorder;
use App\Extensions\InteractionEngine\System\Generator\GeneratorEngine;
use App\Extensions\InteractionEngine\System\Healer\HealerEngine;
use App\Extensions\InteractionEngine\System\Http\Middleware\EnsureInteractionEngineEnabled;
use App\Extensions\InteractionEngine\System\Lifecycle\ExtensionState;
use App\Extensions\InteractionEngine\System\Knowledge\KnowledgeRegistry;
use App\Extensions\InteractionEngine\System\Knowledge\Sources\CustomerKnowledgeSource;
use App\Extensions\InteractionEngine\System\Knowledge\Sources\ServiceKnowledgeSource;
use App\Extensions\InteractionEngine\System\Learner\LearnerEngine;
use App\Extensions\InteractionEngine\System\LocalIntelligence\LocalBrain;
use App\Extensions\InteractionEngine\System\Company\AuthenticatedUserCompanyContextResolver;
use App\Extensions\InteractionEngine\System\Company\CompanyContextResolverContract;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContextFactory;
use App\Extensions\InteractionEngine\System\LocalIntelligence\Storage\LocalIntelligenceMemoryStoreInterface;
use App\Extensions\InteractionEngine\System\LocalIntelligence\Storage\EloquentLocalIntelligenceMemoryStore;
use App\Extensions\InteractionEngine\System\Navigation\NavigationEngine;
use App\Extensions\InteractionEngine\System\Offline\ConflictResolver;
use App\Extensions\InteractionEngine\System\Offline\OfflineDetector;
use App\Extensions\InteractionEngine\System\Offline\OfflineQueue;
use App\Extensions\InteractionEngine\System\Pattern\PatternRegistry;
use App\Extensions\InteractionEngine\System\Policy\PolicyEngine;
use App\Extensions\InteractionEngine\System\Authority\ApprovalSigner;
use App\Extensions\InteractionEngine\System\Authority\AuthorityLevel;
use App\Extensions\InteractionEngine\System\Authority\CapabilityPolicy;
use App\Extensions\InteractionEngine\System\Predictor\PredictorEngine;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityAliasRegistry;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityProviderRegistry;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityRouter;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\CrmCapabilityGatewayInterface;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\BuilderCapabilityGatewayInterface;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\ChatbotCapabilityGatewayInterface;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\ConnectCapabilityGatewayInterface;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\MobileCapabilityGatewayInterface;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\TitanAICapabilityGatewayInterface;
use App\Extensions\InteractionEngine\System\Capabilities\Providers\CrmCapabilityProvider;
use App\Extensions\InteractionEngine\System\Capabilities\Providers\BuilderCapabilityProvider;
use App\Extensions\InteractionEngine\System\Capabilities\Providers\ChatbotCapabilityProvider;
use App\Extensions\InteractionEngine\System\Capabilities\Providers\ConnectCapabilityProvider;
use App\Extensions\InteractionEngine\System\Capabilities\Providers\MobileCapabilityProvider;
use App\Extensions\InteractionEngine\System\Capabilities\Providers\TitanAICapabilityProvider;
use App\Extensions\InteractionEngine\System\Capabilities\Integrations\BuilderCurrentGatewayAdapter;
use App\Extensions\InteractionEngine\System\Capabilities\Integrations\ConnectCurrentGatewayAdapter;
use App\Extensions\InteractionEngine\System\Registry\CapabilityRegistry;
use App\Extensions\InteractionEngine\System\Renderer\BladeRenderer;
use App\Extensions\InteractionEngine\System\Repositories\EloquentInteractionAnswerRepository;
use App\Extensions\InteractionEngine\System\Repositories\EloquentInteractionRunRepository;
use App\Extensions\InteractionEngine\System\Repositories\InteractionAnswerRepositoryInterface;
use App\Extensions\InteractionEngine\System\Repositories\InteractionRunRepositoryInterface;
use App\Extensions\InteractionEngine\System\Resolver\QuestionResolver;
use App\Extensions\InteractionEngine\System\State\StateManager;
use App\Extensions\InteractionEngine\System\Validation\ValidationEngine;
use App\Extensions\InteractionEngine\System\Wizard\Command\CommandMapper;
use App\Extensions\InteractionEngine\System\Wizard\Guidance\LocalGuidanceProvider;
use App\Extensions\InteractionEngine\System\Wizard\Context\WizardExecutionContextFactory;
use App\Extensions\InteractionEngine\System\Wizard\Security\WizardSessionAccessPolicy;
use App\Extensions\InteractionEngine\System\Wizard\Security\WizardAccessPolicy;
use App\Extensions\InteractionEngine\System\Wizard\Offline\LocalCommandOutbox;
use App\Extensions\InteractionEngine\System\Wizard\Offline\WizardOutboxStoreInterface;
use App\Extensions\InteractionEngine\System\Wizard\Offline\DatabaseWizardOutboxStore;
use App\Extensions\InteractionEngine\System\Wizard\UniversalWizardEngine;
use App\Extensions\InteractionEngine\System\Wizard\Validation\WizardValidationEngine;
use App\Extensions\InteractionEngine\System\Wizard\WizardRegistry;
use App\Extensions\InteractionEngine\System\Template\TemplateCompatibilityChecker;
use App\Extensions\InteractionEngine\System\Template\TemplateRegistry;
use App\Extensions\InteractionEngine\System\Profile\FieldHomeServicesProfile;
use App\Extensions\InteractionEngine\System\Profile\FieldHomeServicesVerticalPackRegistry;
use App\Extensions\InteractionEngine\System\Onboarding\OnboardingPlanCompiler;
use App\Extensions\InteractionEngine\System\Onboarding\OnboardingActionExecutor;
use App\Extensions\InteractionEngine\System\Onboarding\OnboardingReadinessService;
use App\Extensions\InteractionEngine\System\Onboarding\OnboardingProgressService;
use App\Extensions\InteractionEngine\System\Surfaces\SurfaceWizardPolicy;
use App\Extensions\InteractionEngine\System\Journey\JourneyRegistry;
use App\Extensions\InteractionEngine\System\Onboarding\Storage\OnboardingPlanStoreInterface;
use App\Extensions\InteractionEngine\System\Onboarding\Storage\CacheOnboardingPlanStore;
use App\Extensions\InteractionEngine\System\Onboarding\Storage\OnboardingExecutionLedgerInterface;
use App\Extensions\InteractionEngine\System\Onboarding\Storage\CacheOnboardingExecutionLedger;
use App\Extensions\InteractionEngine\System\Onboarding\Storage\OnboardingApprovalStoreInterface;
use App\Extensions\InteractionEngine\System\Onboarding\Storage\CacheOnboardingApprovalStore;
use App\Extensions\InteractionEngine\System\Settings\SettingsPolicy;
use App\Extensions\InteractionEngine\System\Settings\SettingsRepository;
use App\Extensions\InteractionEngine\System\Settings\SettingsResolver;
use App\Extensions\InteractionEngine\System\Contracts\PresentationIntentPlannerInterface;
use App\Extensions\InteractionEngine\System\Contracts\PublicInteractionEngineInterface;
use App\Extensions\InteractionEngine\System\Contracts\InteractionContextFactoryInterface;
use App\Extensions\InteractionEngine\System\Contracts\CapabilityIntentGatewayInterface;
use App\Extensions\InteractionEngine\System\Contracts\GovernedOperationLedgerInterface;
use App\Extensions\InteractionEngine\System\Contracts\GovernedOperationActivityGatewayInterface;
use App\Extensions\InteractionEngine\System\Operations\CacheGovernedOperationLedger;
use App\Extensions\InteractionEngine\System\Operations\GovernedOperationActivityGateway;
use App\Extensions\InteractionEngine\System\CapabilityIntentGateway;
use App\Extensions\InteractionEngine\System\Context\InteractionContextFactory;
use App\Extensions\InteractionEngine\System\Presentation\DeterministicPresentationIntentPlanner;
use App\Extensions\InteractionEngine\System\AI\Providers\AIProviderRegistry;
use App\Extensions\InteractionEngine\System\Release\CurrentRelease;


final class InteractionEngineServiceProvider extends ServiceProvider implements
    ExtensionRegisterKeyProviderInterface,
    UninstallExtensionServiceProviderInterface
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/interaction-engine.php', 'interaction-engine');

        $this->app->singleton(CurrentRelease::class);
        $this->app->singleton(SettingsPolicy::class);
        $this->app->singleton(SettingsRepository::class);
        $this->app->singleton(SettingsResolver::class);
        $this->app->singleton(AIProviderRegistry::class);
        $this->app->singleton(PresentationIntentPlannerInterface::class, DeterministicPresentationIntentPlanner::class);
        $this->app->singleton(PublicInteractionEngineInterface::class, PublicInteractionEngine::class);
        $this->app->singleton(InteractionContextFactoryInterface::class, InteractionContextFactory::class);

        $this->app->singleton(CompanyContextResolverContract::class, static function (): CompanyContextResolverContract {
            return new AuthenticatedUserCompanyContextResolver((array) config('interaction-engine.company_context.user_company_keys', ['company_id']));
        });

        $this->app->scoped(CompanyExecutionContext::class, static fn ($app): CompanyExecutionContext =>
            CompanyExecutionContextFactory::fromApplication($app, $app->make(CompanyContextResolverContract::class))
        );

        $this->app->singleton(ExtensionState::class);
        $this->app->scoped(InteractionEngineManagerContract::class, InteractionEngineManager::class);
        $this->app->singleton(FieldHomeServicesProfile::class);
        $this->app->singleton(SurfaceWizardPolicy::class);
        $this->app->singleton(FieldHomeServicesVerticalPackRegistry::class);
        $this->app->singleton(JourneyRegistry::class);
        $this->app->singleton(OnboardingPlanCompiler::class);
        $this->app->singleton(OnboardingPlanStoreInterface::class, function ($app): OnboardingPlanStoreInterface {
            return new CacheOnboardingPlanStore(
                $app['cache.store'],
                (int) config('interaction-engine.wizard.onboarding_plan_ttl', 86400),
            );
        });
        $this->app->singleton(OnboardingExecutionLedgerInterface::class, function ($app): OnboardingExecutionLedgerInterface {
            return new CacheOnboardingExecutionLedger(
                $app['cache.store'],
                (int) config('interaction-engine.wizard.onboarding_ledger_ttl', 604800),
            );
        });
        $this->app->singleton(OnboardingApprovalStoreInterface::class, fn ($app): OnboardingApprovalStoreInterface => new CacheOnboardingApprovalStore($app['cache.store']));
        $this->app->scoped(OnboardingReadinessService::class);
        $this->app->scoped(OnboardingProgressService::class);
        $this->app->scoped(OnboardingActionExecutor::class);

        $this->app->singleton(CapabilityAliasRegistry::class, fn (): CapabilityAliasRegistry => new CapabilityAliasRegistry((array) config('interaction-engine.capabilities.aliases', [])));
        $this->app->singleton(CapabilityProviderRegistry::class, function ($app): CapabilityProviderRegistry {
            $registry = new CapabilityProviderRegistry();

            $crmGateway = $app->bound(CrmCapabilityGatewayInterface::class) ? $app->make(CrmCapabilityGatewayInterface::class) : null;
            $builderGateway = $app->bound(BuilderCapabilityGatewayInterface::class) ? $app->make(BuilderCapabilityGatewayInterface::class) : $this->currentBuilderGateway($app);
            $chatbotGateway = $app->bound(ChatbotCapabilityGatewayInterface::class) ? $app->make(ChatbotCapabilityGatewayInterface::class) : null;
            $connectGateway = $app->bound(ConnectCapabilityGatewayInterface::class) ? $app->make(ConnectCapabilityGatewayInterface::class) : $this->currentConnectGateway($app);
            $mobileGateway = $app->bound(MobileCapabilityGatewayInterface::class) ? $app->make(MobileCapabilityGatewayInterface::class) : null;
            $titanAiGateway = $app->bound(TitanAICapabilityGatewayInterface::class) ? $app->make(TitanAICapabilityGatewayInterface::class) : null;

            $registry->register(new CrmCapabilityProvider($crmGateway));
            $registry->register(new BuilderCapabilityProvider($builderGateway));
            $registry->register(new ChatbotCapabilityProvider($chatbotGateway));
            $registry->register(new ConnectCapabilityProvider($connectGateway));
            $registry->register(new MobileCapabilityProvider($mobileGateway));
            $registry->register(new TitanAICapabilityProvider($titanAiGateway));
            return $registry;
        });
        $this->app->singleton(CapabilityRouter::class, fn ($app): CapabilityRouter => new CapabilityRouter(
            $app->make(CapabilityProviderRegistry::class),
            $app->make(CapabilityAliasRegistry::class),
        ));
        $this->app->singleton(GovernedOperationLedgerInterface::class, function ($app): GovernedOperationLedgerInterface {
            return new CacheGovernedOperationLedger($app['cache.store'], (int) config('interaction-engine.operations.ttl_seconds', 604800));
        });
        $this->app->singleton(GovernedOperationActivityGatewayInterface::class, GovernedOperationActivityGateway::class);
        $this->app->singleton(CapabilityIntentGatewayInterface::class, CapabilityIntentGateway::class);
        $this->app->singleton(ApprovalSigner::class, fn(): ApprovalSigner => new ApprovalSigner((string) config('interaction-engine.authority.approval_secret')));
        $this->app->singleton(PolicyEngineInterface::class, fn($app): PolicyEngineInterface => new PolicyEngine($app->make(ApprovalSigner::class)));
        $this->app->scoped(EventRecorderInterface::class, EventRecorder::class);
        $this->app->singleton(CognitiveEventStoreInterface::class, EloquentCognitiveEventStore::class);
        $this->app->singleton(DecisionRecorder::class);
        $this->app->singleton(ObservationRecorder::class);
        $this->app->singleton(OutcomeRecorder::class);
        $this->app->singleton(OutcomeLinker::class);
        $this->app->scoped(CapabilityRegistry::class, function ($app): CapabilityRegistry {
            $registry = new CapabilityRegistry($app->make(CapabilityRouter::class));
            foreach ($app->make(WizardRegistry::class)->all() as $wizard) {
                $registry->declare($wizard->capability);
            }

            $compiler = $app->make(OnboardingPlanCompiler::class);
            foreach ($compiler->actionCapabilities() as $capability) {
                $registry->declare($capability);
            }

            // Compilation is extension-owned and safe to execute locally. The resulting
            // plan is stored server-side under company_id; individual setup actions remain
            // fail-closed until their owning Titan provider gateways are available.
            $registry->register('interaction.onboarding.compile', function (array $payload) use ($app, $compiler): array {
                $context = (array) ($payload['_context'] ?? []);
                $companyId = $app->make(CompanyExecutionContext::class)->companyId();
                if (isset($context['company_id']) && (string) $context['company_id'] !== $companyId) {
                    throw new \RuntimeException('Onboarding compile company_id does not match trusted company_id.');
                }
                if (isset($context['company_id']) && (string) $context['company_id'] !== $companyId) {
                    throw new \RuntimeException('company_id does not match trusted company_id.');
                }
                $answers = $payload;
                unset($answers['_context']);
                $plan = $compiler->compile(
                    $companyId,
                    $answers,
                    isset($context['wizard_run_id']) ? (string) $context['wizard_run_id'] : null,
                    array_replace($context, ['company_id' => $companyId]),
                );
                $app->make(OnboardingPlanStoreInterface::class)->put($plan);
                return $plan->toArray();
            });
            $registry->register('interaction.onboarding.activate', static function (array $payload): array {
                return [
                    'journey_state' => 'activated',
                    'onboarding_plan_id' => $payload['_context']['onboarding_plan_id'] ?? null,
                    'note' => 'Interaction onboarding journey activated after external readiness checks; no external subsystem success is implied.',
                ];
            });
            return $registry;
        });
        $this->app->scoped(CommandBusInterface::class, function ($app): CommandBusInterface {
            $bus = $app->make(CommandBus::class);
            $registry = $app->make(CapabilityRegistry::class);
            foreach ($registry->declaredCapabilities() as $capability) {
                if ($registry->isLocal($capability)) {
                    $bus->registerHandler($capability, static fn(array $payload): mixed => ($registry->getHandler($capability))($payload));
                }
            }
            return $bus;
        });
        $this->app->singleton(SchemaValidator::class);
        $this->app->singleton(FragmentResolver::class);
        $this->app->singleton(ConditionRegistry::class);
        $this->app->singleton(InteractionCompiler::class);
        $this->app->singleton(InteractionRegistry::class);
        // ExecutiveEngine/CognitiveOrchestrator/WorldModel each satisfy
        // two interfaces (a legacy App\Extensions\InteractionEngine\System\Contracts one and
        // the new App\Extensions\InteractionEngine\System\Engines\...\Contracts one from the 80-engine
        // library). Binding each interface independently via singleton()
        // would make Laravel construct two separate objects with two
        // separate internal states (e.g. two different $interruptions
        // queues on "the" executive engine) — bind the real concrete class
        // once and alias every interface to that one instance.

        // Canonical bindings for the engine library. Every engine contract has one concrete implementation
        // in this release; registering them explicitly makes the scoped executive/cognitive graphs resolvable.
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts\EmbeddingEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Implementations\EmbeddingEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts\EvaluationEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Implementations\EvaluationEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts\FunctionCallingEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Implementations\FunctionCallingEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts\GuardrailEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Implementations\GuardrailEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts\ModelSelectionEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Implementations\ModelSelectionEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts\PromptEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Implementations\PromptEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts\PromptOptimizationEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Implementations\PromptOptimizationEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts\RetrievalEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Implementations\RetrievalEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts\ToolCallingEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Implementations\ToolCallingEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts\VectorSearchEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Implementations\VectorSearchEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts\AnalyticsEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations\AnalyticsEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts\AuditEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations\AuditEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts\AutomationEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations\AutomationEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts\BusinessBuilderEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations\BusinessBuilderEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts\CRMIntelligenceEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations\CRMIntelligenceEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts\ComplianceEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations\ComplianceEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts\DispatchEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations\DispatchEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts\FinancialInsightEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations\FinancialInsightEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts\MonitoringEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations\MonitoringEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts\OperationsEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations\OperationsEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\AbstractionEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations\AbstractionEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\AnalogyEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations\AnalogyEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\ConceptEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations\ConceptEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\CreativityEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations\CreativityEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\ExplainabilityEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations\ExplainabilityEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\InferenceEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations\InferenceEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\ReasoningEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations\ReasoningEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\ReflectionEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations\ReflectionEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\SemanticEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations\SemanticEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Executive\Contracts\DecisionEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Executive\Implementations\DecisionEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Executive\Contracts\EscalationEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Executive\Implementations\EscalationEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Executive\Contracts\GoalEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Executive\Implementations\GoalEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Executive\Contracts\GovernanceEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Executive\Implementations\GovernanceEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Executive\Contracts\OpportunityEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Executive\Implementations\OpportunityEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Executive\Contracts\PolicyEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Executive\Implementations\PolicyEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Executive\Contracts\PriorityEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Executive\Implementations\PriorityEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Executive\Contracts\RiskEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Executive\Implementations\RiskEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Executive\Contracts\StrategicPlanningEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Executive\Implementations\StrategicPlanningEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts\ClarificationEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Implementations\ClarificationEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts\ConversationEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Implementations\ConversationEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts\DialogueEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Implementations\DialogueEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts\EmotionEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Implementations\EmotionEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts\EmpathyEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Implementations\EmpathyEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts\IntentEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Implementations\IntentEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts\PersonalityEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Implementations\PersonalityEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts\ResponseGenerationEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Implementations\ResponseGenerationEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts\SentimentEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Implementations\SentimentEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts\TrustEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Implementations\TrustEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Learning\Contracts\BehaviourLearningEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Learning\Implementations\BehaviourLearningEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Learning\Contracts\FeedbackEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Learning\Implementations\FeedbackEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Learning\Contracts\GeneralizationEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Learning\Implementations\GeneralizationEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Learning\Contracts\LearningEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Learning\Implementations\LearningEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Learning\Contracts\PatternRecognitionEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Learning\Implementations\PatternRecognitionEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Learning\Contracts\PredictionEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Learning\Implementations\PredictionEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Learning\Contracts\PreferenceLearningEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Learning\Implementations\PreferenceLearningEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Learning\Contracts\RecommendationEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Learning\Implementations\RecommendationEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Learning\Contracts\ReinforcementLearningEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Learning\Implementations\ReinforcementLearningEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Learning\Contracts\SimilarityEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Learning\Implementations\SimilarityEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Memory\Contracts\ContextEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Memory\Implementations\ContextEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Memory\Contracts\EpisodicMemoryEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Memory\Implementations\EpisodicMemoryEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Memory\Contracts\ForgettingEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Memory\Implementations\ForgettingEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Memory\Contracts\KnowledgeExtractionEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Memory\Implementations\KnowledgeExtractionEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Memory\Contracts\KnowledgeGraphEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Memory\Implementations\KnowledgeGraphEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Memory\Contracts\MemoryConsolidationEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Memory\Implementations\MemoryConsolidationEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Memory\Contracts\MemoryEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Memory\Implementations\MemoryEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Memory\Contracts\ProceduralMemoryEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Memory\Implementations\ProceduralMemoryEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Memory\Contracts\SemanticMemoryEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Memory\Implementations\SemanticMemoryEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Planning\Contracts\CapabilityRoutingEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Planning\Implementations\CapabilityRoutingEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Planning\Contracts\ExecutionEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Planning\Implementations\ExecutionEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Planning\Contracts\PlanningEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Planning\Implementations\PlanningEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Planning\Contracts\RecoveryEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Planning\Implementations\RecoveryEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Planning\Contracts\ResourceAllocationEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Planning\Implementations\ResourceAllocationEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Planning\Contracts\RetryEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Planning\Implementations\RetryEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Planning\Contracts\SchedulingEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Planning\Implementations\SchedulingEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Planning\Contracts\SynchronizationEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Planning\Implementations\SynchronizationEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Planning\Contracts\TaskDecompositionEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Planning\Implementations\TaskDecompositionEngine::class);
        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Planning\Contracts\WorkflowEngineInterface::class, \App\Extensions\InteractionEngine\System\Engines\Planning\Implementations\WorkflowEngine::class);

        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Executive\Implementations\ExecutiveEngine::class);
        $this->app->scoped(
            \App\Extensions\InteractionEngine\System\Engines\Executive\Contracts\ExecutiveEngineInterface::class,
            fn ($app) => $app->make(\App\Extensions\InteractionEngine\System\Engines\Executive\Implementations\ExecutiveEngine::class)
        );
        $this->app->scoped(
            ExecutiveEngineInterface::class,
            fn ($app) => $app->make(\App\Extensions\InteractionEngine\System\Engines\Executive\Implementations\ExecutiveEngine::class)
        );

        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations\CognitiveOrchestrator::class);
        $this->app->scoped(
            \App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\CognitiveOrchestratorInterface::class,
            fn ($app) => $app->make(\App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations\CognitiveOrchestrator::class)
        );
        $this->app->scoped(
            CognitiveOrchestratorInterface::class,
            fn ($app) => $app->make(\App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations\CognitiveOrchestrator::class)
        );

        $this->app->scoped(\App\Extensions\InteractionEngine\System\Engines\Memory\Implementations\WorldModelEngine::class);
        $this->app->scoped(
            \App\Extensions\InteractionEngine\System\Engines\Memory\Contracts\WorldModelEngineInterface::class,
            fn ($app) => $app->make(\App\Extensions\InteractionEngine\System\Engines\Memory\Implementations\WorldModelEngine::class)
        );
        $this->app->scoped(
            WorldModelInterface::class,
            fn ($app) => $app->make(\App\Extensions\InteractionEngine\System\Engines\Memory\Implementations\WorldModelEngine::class)
        );

        $this->app->bind(InteractionRunRepositoryInterface::class, EloquentInteractionRunRepository::class);
        $this->app->bind(InteractionAnswerRepositoryInterface::class, EloquentInteractionAnswerRepository::class);
        $this->app->singleton(StateManagerInterface::class, StateManager::class);
        $this->app->singleton(NavigationEngineInterface::class, NavigationEngine::class);
        $this->app->singleton(ValidationEngineInterface::class, ValidationEngine::class);
        $this->app->singleton(RendererInterface::class, fn(): RendererInterface => new BladeRenderer((string) config('interaction-engine.view', 'interaction::run')));

        $this->app->scoped(KnowledgeRegistry::class, function ($app): KnowledgeRegistry {
            $registry = new KnowledgeRegistry();
            $registry->registerSource($app->make(CustomerKnowledgeSource::class));
            $registry->registerSource($app->make(ServiceKnowledgeSource::class));
            return $registry;
        });
        $this->app->scoped(ContextBuilder::class, function ($app): ContextBuilder {
            $builder = new ContextBuilder($app->make(CompanyExecutionContext::class));
            $builder->registerProvider($app->make(CustomerContextProvider::class));
            $builder->registerProvider(new PolicyContextProvider());
            return $builder;
        });
        $this->app->scoped(QuestionResolverInterface::class, QuestionResolver::class);

        $this->app->bind(AIServiceInterface::class, fn ($app): AIServiceInterface => new LocalBrainGuidanceService(
            $app->make(LocalBrain::class),
        ));

        $this->app->scoped(OfflineQueueInterface::class, OfflineQueue::class);
        $this->app->singleton(ConflictResolverInterface::class, ConflictResolver::class);
        $this->app->singleton(OfflineDetector::class, fn(): OfflineDetector => new OfflineDetector((string) config('interaction-engine.offline.health_check_url')));

        $this->app->scoped(PredictorInterface::class, PredictorEngine::class);
        $this->app->scoped(LearnerInterface::class, LearnerEngine::class);
        $this->app->scoped(GeneratorInterface::class, GeneratorEngine::class);
        $this->app->scoped(HealerInterface::class, HealerEngine::class);
        $this->app->scoped(PatternRegistry::class);
        $this->app->scoped(ContextGraph::class);
        $this->app->scoped(AutoCompleteEngine::class);

        $this->app->singleton(LocalIntelligenceMemoryStoreInterface::class, EloquentLocalIntelligenceMemoryStore::class);
        $this->app->scoped(LocalBrain::class, function ($app): LocalBrain {
            $store = $app->make(LocalIntelligenceMemoryStoreInterface::class);
            $companyId = $app->make(CompanyExecutionContext::class)->companyId();

            return LocalBrain::createWithPersistence(
                $store,
                $companyId,
                $app->make(CognitiveEventStoreInterface::class),
            );
        });
        $this->app->singleton(WizardRegistry::class, function ($app): WizardRegistry {
            $registry = new WizardRegistry();
            $registry->discover((string) config('interaction-engine.wizard.definitions_path'));
            $profile = $app->make(FieldHomeServicesProfile::class);
            $registry->retain(static fn($wizard): bool => $profile->allowsWizard($wizard));
            return $registry;
        });
        $this->app->singleton(TemplateRegistry::class, function ($app): TemplateRegistry {
            $registry = new TemplateRegistry();
            $registry->discover((string) config('interaction-engine.template.definitions_path'));
            $profile = $app->make(FieldHomeServicesProfile::class);
            $registry->retain(static fn($template): bool => $profile->allowsTemplate($template));
            return $registry;
        });
        $this->app->singleton(TemplateCompatibilityChecker::class, fn($app): TemplateCompatibilityChecker => new TemplateCompatibilityChecker(
            $app->make(WizardRegistry::class),
        ));
        $this->app->singleton(WizardOutboxStoreInterface::class, DatabaseWizardOutboxStore::class);
        $this->app->scoped(LocalCommandOutbox::class, fn($app): LocalCommandOutbox => new LocalCommandOutbox(
            (string) config('interaction-engine.wizard.outbox_secret'),
            $app->make(WizardOutboxStoreInterface::class),
            $app->make(CompanyExecutionContext::class)->companyId(),
        ));
        $this->app->singleton(WizardValidationEngine::class);
        $this->app->singleton(LocalGuidanceProvider::class);
        $this->app->singleton(WizardExecutionContextFactory::class);
        $this->app->singleton(WizardSessionAccessPolicy::class);
        $this->app->singleton(WizardAccessPolicy::class);
        $this->app->singleton(CommandMapper::class, fn($app): CommandMapper => new CommandMapper($app->make(ApprovalSigner::class)));
        $this->app->bind(UniversalWizardEngine::class, function ($app): UniversalWizardEngine {
            $companyId = $app->make(CompanyExecutionContext::class)->companyId();
            $offlineAllowed = $app->make(SettingsResolver::class)->companyBool($companyId, 'offline_enabled', (bool) config('interaction-engine.offline.enabled', true));
            $offline = $offlineAllowed && $app->make(OfflineDetector::class)->isOffline();
            return new UniversalWizardEngine(
                $app->make(WizardRegistry::class),
                $app->make(WizardValidationEngine::class),
                $app->make(LocalGuidanceProvider::class),
                $app->make(CommandMapper::class),
                $app->make(LocalCommandOutbox::class),
                $offline ? null : $app->make(CommandBusInterface::class),
                $app->make(CognitiveEventStoreInterface::class),
                null,
                $app->make(CapabilityRegistry::class),
            );
        });
        $this->app->singleton(HybridRenderer::class);
        $this->app->singleton(WizardSessionStoreInterface::class, function ($app): WizardSessionStoreInterface {
            return new CacheWizardSessionStore(
                $app['cache.store'],
                $app->make(WizardRegistry::class),
                (int) config('interaction-engine.wizard.session_ttl', 86400),
            );
        });

        $this->registerEngineLibrary();
    }

    public function boot(): void
    {
        $this->loadViewsFrom(__DIR__ . '/../resources/views', 'interaction-engine');
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');

        $langPath = __DIR__ . '/../resources/lang';
        if (is_dir($langPath)) {
            $this->loadTranslationsFrom($langPath, 'interaction-engine');
        }

        $this->publishes([
            __DIR__ . '/../config/interaction-engine.php' => config_path('interaction-engine.php'),
        ], 'interaction-engine-config');

        $this->registerRoutes();
        $this->registerAdminNavigation();

        if ($this->app->runningInConsole()) {
            $this->commands([
                CompileInteractionCommand::class,
                HealthCheckCommand::class,
                InstallCommand::class,
                ListTemplatesCommand::class,
                SeedCommand::class,
                SyncInteractionCommand::class,
            ]);
        }

        $this->registerPolicies();
    }

    public function registerKey(): string
    {
        return 'interaction-engine';
    }

    public static function uninstall(): void
    {
        // Idempotent and non-destructive: database tenant data is retained.
        if (function_exists('storage_path')) {
            \Illuminate\Support\Facades\File::deleteDirectory(storage_path('app/interaction-engine'));
        }
        if (function_exists('public_path')) {
            \Illuminate\Support\Facades\File::deleteDirectory(public_path('vendor/interaction-engine'));
        }
    }

    private function currentBuilderGateway($app): ?BuilderCapabilityGatewayInterface
    {
        $previewContract = 'App\\Extensions\\TitanBuilder\\System\\Contracts\\PreviewRenderer';
        $publisherContract = 'App\\Extensions\\TitanBuilder\\System\\Contracts\\Publisher';
        $preview = interface_exists($previewContract) && $app->bound($previewContract) ? $app->make($previewContract) : null;
        $publisher = interface_exists($publisherContract) && $app->bound($publisherContract) ? $app->make($publisherContract) : null;
        return ($preview !== null || $publisher !== null) ? new BuilderCurrentGatewayAdapter($preview, $publisher) : null;
    }

    private function currentConnectGateway($app): ?ConnectCapabilityGatewayInterface
    {
        $contract = 'App\\Extensions\\TitanConnect\\System\\Contracts\\MessagingToolGateway';
        if (!interface_exists($contract) || !$app->bound($contract)) return null;
        return new ConnectCurrentGatewayAdapter($app->make($contract));
    }

    private function registerRoutes(): void
    {
        /** @var Router $router */
        $router = $this->app['router'];

        $router->group([
            'middleware' => ['web', 'auth', EnsureInteractionEngineEnabled::class],
            'prefix' => 'dashboard/user/interaction-engine',
            'as' => 'dashboard.user.interaction-engine.',
        ], static function (): void {
            require __DIR__ . '/../routes/user.php';
        });

        $router->group([
            'middleware' => ['web', 'auth', 'admin'],
            'prefix' => 'dashboard/admin/interaction-engine',
            'as' => 'dashboard.admin.interaction-engine.',
        ], static function (): void {
            require __DIR__ . '/../routes/admin.php';
        });

        $router->group([
            'middleware' => ['api', 'auth:sanctum', EnsureInteractionEngineEnabled::class],
            'prefix' => 'api/interaction-engine/v1',
            'as' => 'api.interaction-engine.v1.',
        ], static function (): void {
            require __DIR__ . '/../routes/api.php';
        });

        // Backwards-compatible API alias. Both profiles resolve to the same controllers/services.
        $router->group([
            'middleware' => ['api', 'auth:sanctum', EnsureInteractionEngineEnabled::class],
            'prefix' => 'api/interaction',
            'as' => 'api.interaction.compat.',
        ], static function (): void {
            require __DIR__ . '/../routes/api.php';
        });
    }

    /**
     * Register Super Admin navigation without making navigation a boot dependency.
     * Blueprint/Titan hosts use ContributionRegistry; older MagicAI hosts fall back
     * to idempotent rows under the existing Settings menu when the schema supports it.
     */
    private function registerAdminNavigation(): void
    {
        $registered = false;
        $registryClass = 'App\\Support\\Extensions\\ContributionRegistry';

        if (class_exists($registryClass)) {
            try {
                $registry = $this->app->make($registryClass);
                foreach ($this->adminMenuDefinitions() as $definition) {
                    $registered = $this->contributeNavigation($registry, 'navigation.admin', $definition) || $registered;
                }
            } catch (\Throwable) {
                $registered = false;
            }
        }

        if (!$registered) {
            $this->syncAdminMenuFallback();
        }

        $this->regenerateMenuCache();
    }

    /** @return array<int,array<string,mixed>> */
    private function adminMenuDefinitions(): array
    {
        return [
            [
                'key' => 'titan_interaction_engine_admin',
                'parent_key' => null,
                'label' => 'Interaction Engine',
                'route' => 'dashboard.admin.interaction-engine.index',
                'icon' => 'tabler-settings',
                'order' => 82,
                'is_active' => 1,
                'is_admin' => 1,
                'type' => 'item',
                'extension' => 'interaction-engine',
                'data-name' => 'interaction-engine-admin',
            ],
            [
                'key' => 'titan_interaction_engine_admin_overview',
                'parent_key' => 'titan_interaction_engine_admin',
                'label' => 'Overview',
                'route' => 'dashboard.admin.interaction-engine.index',
                'icon' => 'tabler-settings',
                'order' => 1,
                'is_active' => 1,
                'is_admin' => 1,
                'type' => 'item',
                'extension' => 'interaction-engine',
            ],
            [
                'key' => 'titan_interaction_engine_admin_settings',
                'parent_key' => 'titan_interaction_engine_admin',
                'label' => 'Settings',
                'route' => 'dashboard.admin.interaction-engine.settings',
                'icon' => 'tabler-settings',
                'order' => 2,
                'is_active' => 1,
                'is_admin' => 1,
                'type' => 'item',
                'extension' => 'interaction-engine',
            ],
        ];
    }

    private function contributeNavigation(object $registry, string $channel, array $definition): bool
    {
        foreach (['register', 'contribute', 'add'] as $method) {
            if (!method_exists($registry, $method)) continue;
            try {
                $reflection = new \ReflectionMethod($registry, $method);
                $parameters = $reflection->getNumberOfParameters();
                if ($parameters <= 1) {
                    $registry->{$method}($definition);
                } elseif ($parameters === 2) {
                    $registry->{$method}($channel, $definition);
                } else {
                    $registry->{$method}($channel, (string) ($definition['key'] ?? 'interaction-engine'), $definition);
                }
                return true;
            } catch (\Throwable) {
                // Try the next common registry method shape. Navigation must never break boot.
            }
        }
        return false;
    }

    private function syncAdminMenuFallback(): void
    {
        try {
            if (!\Illuminate\Support\Facades\Schema::hasTable('menus')) return;
            if (!\Illuminate\Support\Facades\Schema::hasColumn('menus', 'key')) return;
            if (!\Illuminate\Support\Facades\Schema::hasColumn('menus', 'route')) return;
            if (!\Illuminate\Support\Facades\Schema::hasColumn('menus', 'label')) return;

            $settingsParentId = null;
            if (\Illuminate\Support\Facades\Schema::hasColumn('menus', 'parent_id')) {
                $settingsParentId = \Illuminate\Support\Facades\app('db')->table('menus')->where('key', 'settings')->value('id');
            }

            $hasAdminColumn = \Illuminate\Support\Facades\Schema::hasColumn('menus', 'is_admin');
            if ($settingsParentId === null && !$hasAdminColumn) return;

            $rows = [
                [
                    'key' => 'titan_interaction_engine_admin_overview',
                    'route' => 'dashboard.admin.interaction-engine.index',
                    'label' => 'Interaction Engine',
                    'order' => 90,
                ],
                [
                    'key' => 'titan_interaction_engine_admin_settings',
                    'route' => 'dashboard.admin.interaction-engine.settings',
                    'label' => 'Interaction Engine Settings',
                    'order' => 91,
                ],
            ];

            foreach ($rows as $row) {
                $values = [
                    'parent_id' => $settingsParentId,
                    'route' => $row['route'],
                    'route_slug' => null,
                    'label' => $row['label'],
                    'icon' => 'tabler-settings',
                    'svg' => null,
                    'order' => $row['order'],
                    'is_active' => 1,
                    'params' => '[]',
                    'type' => 'item',
                    'badge' => null,
                    'extension' => 'interaction-engine',
                    'bolt_menu' => 0,
                    'bolt_background' => null,
                    'bolt_foreground' => null,
                    'letter_icon' => 0,
                    'letter_icon_bg' => null,
                    'custom_menu' => 0,
                    'is_admin' => 1,
                    'updated_at' => now(),
                    'created_at' => now(),
                ];

                $filtered = [];
                foreach ($values as $column => $value) {
                    if (\Illuminate\Support\Facades\Schema::hasColumn('menus', $column)) {
                        $filtered[$column] = $value;
                    }
                }

                \Illuminate\Support\Facades\app('db')->table('menus')->updateOrInsert(
                    ['key' => $row['key']],
                    $filtered,
                );
            }
        } catch (\Throwable) {
            // Menu compatibility is best-effort; routes/settings remain available directly.
        }
    }

    private function regenerateMenuCache(): void
    {
        $menuServiceClass = 'App\\Services\\Common\\MenuService';
        if (!class_exists($menuServiceClass)) return;

        try {
            $service = $this->app->make($menuServiceClass);
            if (method_exists($service, 'regenerate')) {
                $service->regenerate();
            }
        } catch (\Throwable) {
            // Cache regeneration must not make extension installation fail.
        }
    }

    private function registerPolicies(): void
    {
        $policy = $this->app->make(PolicyEngineInterface::class);

        // Provider descriptors establish conservative defaults. Routing never
        // creates authority: every executable external capability has a policy.
        foreach ($this->app->make(CapabilityProviderRegistry::class)->descriptors() as $descriptor) {
            $authority = AuthorityLevel::tryFrom($descriptor->authorityLevel) ?? AuthorityLevel::PrepareOnly;
            $policy->registerCapabilityPolicy(new CapabilityPolicy(
                capability: $descriptor->capability,
                authority: $authority,
                requiredRoles: $descriptor->requiredRoles,
                delegatedScopes: $descriptor->requiredScopes,
                freshAuthenticationSeconds: $descriptor->requiresFreshAuthentication ? $this->app->make(SettingsResolver::class)->platformInt('fresh_authentication_seconds', (int) config('interaction-engine.authority.fresh_authentication_seconds', 300)) : 0,
            ));
        }

        // Wizard-specific authority is narrower than generic provider availability.
        foreach ($this->app->make(WizardRegistry::class)->all() as $wizard) {
            $requiredRoles = array_values(array_map('strval', (array) $wizard->permissions));
            $policy->registerCapabilityPolicy(new CapabilityPolicy(
                capability: $this->app->make(CapabilityAliasRegistry::class)->canonical($wizard->capability),
                authority: AuthorityLevel::UserOnly,
                requiredRoles: $requiredRoles,
            ));
        }

        // Company configuration journeys remain owner/admin scoped. High-risk
        // groups additionally require a cryptographically scoped approval.
        $approvalRequired = [
            'crm.business.payment_settings.update','crm.staff.invite','builder.features.update',
            'mobile.notification.configure','communications.connection.start','ai.authority.update',
            'ai.business.preferences.update','builder.application.configure','crm.business.compliance.update',
            'interaction.onboarding.activate','builder.publish','builder.rollback','chatbot.activate',
        ];
        foreach ($this->app->make(OnboardingPlanCompiler::class)->actionCapabilities() as $capability) {
            $policy->registerCapabilityPolicy(new CapabilityPolicy(
                capability: $capability,
                authority: in_array($capability, $approvalRequired, true) ? AuthorityLevel::ApprovalRequired : AuthorityLevel::UserOnly,
                requiredRoles: ['owner','admin'],
                freshAuthenticationSeconds: $capability === 'interaction.onboarding.activate' ? $this->app->make(SettingsResolver::class)->platformInt('fresh_authentication_seconds', 300) : 0,
                approvalTtlSeconds: 900,
            ));
        }
        $policy->registerCapabilityPolicy(new CapabilityPolicy('interaction.onboarding.compile', AuthorityLevel::UserOnly, ['owner','admin']));

        // Operational field/home-services policies.
        $policies = [
            new CapabilityPolicy('crm.customer.create', AuthorityLevel::UserOnly, requiredRoles: ['customer','sales','support','admin','owner','manager']),
            new CapabilityPolicy('crm.quote.create', AuthorityLevel::ApprovalRequired, requiredRoles: ['owner','manager','estimator','sales'], approvalTtlSeconds: 900),
            new CapabilityPolicy('crm.work_order.create', AuthorityLevel::ApprovalRequired, requiredRoles: ['owner','manager','dispatcher','operations'], approvalTtlSeconds: 900),
            new CapabilityPolicy('crm.work_order.complete', AuthorityLevel::UserOnly, requiredRoles: ['field_worker','supervisor','admin','owner','manager']),
            new CapabilityPolicy('crm.invoice.create', AuthorityLevel::ApprovalRequired, requiredRoles: ['owner','manager','finance'], approvalTtlSeconds: 900),
            new CapabilityPolicy('crm.payment.record', AuthorityLevel::UserOnly, requiredRoles: ['owner','finance'], freshAuthenticationSeconds: 300),
        ];
        foreach ($policies as $capabilityPolicy) $policy->registerCapabilityPolicy($capabilityPolicy);

        $policy->registerPolicy('crm.work_order.create', static fn(array $payload): array => empty($payload['customer_id']) && empty($payload['customer_public_id'])
            ? ['allowed' => false, 'reason' => 'Customer reference is required to create a work order.']
            : ['allowed' => true]);
        $policy->registerPolicy('crm.work_order.complete', static fn(array $payload): array => empty($payload['job_id']) && empty($payload['work_order_id']) && empty($payload['work_order_public_id'])
            ? ['allowed' => false, 'reason' => 'Work-order reference is required to complete work.']
            : ['allowed' => true]);
    }

    private function registerEngineLibrary(): void
    {
        $domains = [
            'Executive' => ['StrategicPlanningEngine','GoalEngine','PriorityEngine','DecisionEngine','PolicyEngine','GovernanceEngine','RiskEngine','OpportunityEngine','EscalationEngine'],
            'Cognitive' => ['SemanticEngine','ReasoningEngine','InferenceEngine','ReflectionEngine','ExplainabilityEngine','AbstractionEngine','ConceptEngine','AnalogyEngine','CreativityEngine'],
            'Memory' => ['MemoryEngine','EpisodicMemoryEngine','SemanticMemoryEngine','ProceduralMemoryEngine','MemoryConsolidationEngine','ForgettingEngine','KnowledgeGraphEngine','KnowledgeExtractionEngine','ContextEngine'],
            'Learning' => ['LearningEngine','ReinforcementLearningEngine','PatternRecognitionEngine','BehaviourLearningEngine','PreferenceLearningEngine','FeedbackEngine','PredictionEngine','RecommendationEngine','SimilarityEngine','GeneralizationEngine'],
            'Planning' => ['PlanningEngine','WorkflowEngine','TaskDecompositionEngine','CapabilityRoutingEngine','ExecutionEngine','SchedulingEngine','ResourceAllocationEngine','SynchronizationEngine','RecoveryEngine','RetryEngine'],
            'HumanInteraction' => ['ConversationEngine','IntentEngine','EmotionEngine','SentimentEngine','PersonalityEngine','EmpathyEngine','ClarificationEngine','DialogueEngine','ResponseGenerationEngine','TrustEngine'],
            'AIInfrastructure' => ['PromptEngine','PromptOptimizationEngine','ModelSelectionEngine','EmbeddingEngine','RetrievalEngine','VectorSearchEngine','ToolCallingEngine','FunctionCallingEngine','GuardrailEngine','EvaluationEngine'],
            'BusinessIntelligence' => ['CRMIntelligenceEngine','OperationsEngine','DispatchEngine','FinancialInsightEngine','AnalyticsEngine','ComplianceEngine','AuditEngine','MonitoringEngine','AutomationEngine','BusinessBuilderEngine'],
        ];
        foreach ($domains as $domain => $engines) {
            foreach ($engines as $engine) {
                $contract = "App\\Extensions\\InteractionEngine\\System\\Engines\\{$domain}\\Contracts\\{$engine}Interface";
                $implementation = "App\\Extensions\\InteractionEngine\\System\\Engines\\{$domain}\\Implementations\\{$engine}";
                $this->app->scoped($contract, $implementation);
            }
        }
    }
}

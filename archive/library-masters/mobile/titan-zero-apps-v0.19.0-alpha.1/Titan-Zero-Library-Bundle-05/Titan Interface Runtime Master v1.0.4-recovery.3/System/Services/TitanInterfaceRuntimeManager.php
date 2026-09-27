<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Services;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Discovery\InterfaceContributionDiscoveryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\TitanInterfaceRuntimeManagerContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\DomainRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\FacetRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ViewRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\LegacyDataSurfaceRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\GlobalWorkRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ActionRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\DecisionProviderRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Presentation\ComponentVocabularyContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Interaction\InteractionEngineGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Governance\GovernanceStateGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\WorkingSet\WorkingSetGatewayContract;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use App\Extensions\TitanInterfaceRuntime\System\Host\TitanHostMenuCompatibilityAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Operations\RuntimeOperationalState;

final readonly class TitanInterfaceRuntimeManager implements TitanInterfaceRuntimeManagerContract
{
    public function __construct(
        private ConfigRepository $config,
        private InterfaceContributionDiscoveryContract $discovery,
        private DomainRegistryContract $domains,
        private ObjectRegistryContract $objects,
        private FacetRegistryContract $facets,
        private ViewRegistryContract $views,
        private LegacyDataSurfaceRegistryContract $legacyData,
        private GlobalWorkRegistryContract $globalWork,
        private ActionRegistryContract $actions,
        private DecisionProviderRegistryContract $decisions,
        private ComponentVocabularyContract $components,
        private InteractionEngineGatewayContract $interactionEngine,
        private GovernanceStateGatewayContract $governance,
        private WorkingSetGatewayContract $workingSets,
        private TitanHostMenuCompatibilityAdapter $hostMenu,
        private RuntimeOperationalState $operationalState,
    ) {
    }

    public function health(): array
    {
        $enabled = (bool) $this->config->get('titan-interface-runtime.enabled', true);

        return [
            'status' => $enabled ? 'HEALTHY' : 'DISABLED',
            'extension' => 'titan-interface-runtime',
            'version' => '1.0.3',
            'plan_pass' => 20,
            'interface_contract_version' => '1.1',
            'supported_interface_contract_versions' => ['1.0','1.1'],
            'runtime_profile' => 'titan-ui',
            'architecture_profile' => 'ui-surface',
            'production_core' => 'titan.production.core.v1',
            'operational_state' => $this->operationalState->readiness(),
            'host_navigation' => $this->hostMenu->status(),
            'business_data_authority' => false,
            'direct_business_writes' => false,
            'context_spine' => [
                'version' => '1.0',
                'strict_tenant_context' => true,
                'security_identity_source' => 'authenticated-principal',
                'caller_mutable_security_fields' => false,
            ],
            'donor_rationalization_e2e_release' => [
                'donors_audited' => ['menu','focus-mode','announcement','onboarding-pro','introductions'],
                'menu_projection_absorbed' => true,
                'workspace_focus_absorbed' => true,
                'attention_hud_absorbed' => true,
                'coachmark_guidance_absorbed' => true,
                'duplicate_wizard_authority' => false,
                'interaction_engine_remains_wizard_authority' => true,
                'announcement_data_owned_locally' => false,
                'focus_preserves_global_safety_controls' => true,
                'e2e_domains' => ['crm','work','finance','connect','maps'],
                'release' => '1.0.3',
            ],
            'provider_boot_hotfix' => [
                'installer_1_7_6_immediate_boot_compatible' => true,
                'facet_registry_explicitly_bound' => true,
                'boot_registry_binding_regression' => true,
                'migrations_changed' => false,
            ],
            'offline_sync_accessibility_performance' => [
                'sync_state_authority' => 'global-work.sync/source-engines',
                'interaction_engine_status_adapter' => true,
                'states' => ['online','offline-local','pending-sync','syncing','synced','conflict','failed','awaiting-online','unknown'],
                'conflict_resolution_owned_locally' => false,
                'wcag_target' => '2.2-AA',
                'keyboard_and_focus_checks' => true,
                'target_size_min_px' => 24,
                'localization_policy' => true,
                'rtl_direction_support' => true,
                'mobile_responsive_audit' => ['go','hub','onboarding'],
                'max_payload_bytes' => (int) $this->config->get('titan-interface-runtime.quality.max_payload_bytes', 524288),
                'max_nodes' => (int) $this->config->get('titan-interface-runtime.quality.max_nodes', 2000),
                'max_depth' => (int) $this->config->get('titan-interface-runtime.quality.max_depth', 16),
                'p95_presentation_budget_ms' => (float) $this->config->get('titan-interface-runtime.quality.p95_presentation_ms', 100.0),
                'presentation_cache_scope' => 'tenant+user+surface+domain+workspace+locale+fingerprint',
                'cross_tenant_cache' => false,
                'direct_sync_queue_ownership' => false,
            ],
            'product_surface_policies' => [
                'surfaces' => ['command','go','hub','onboarding'],
                'command' => ['audience'=>'owner-manager','density'=>'comfortable','advanced_controls'=>true],
                'go' => ['audience'=>'field-worker','density'=>'compact','mobile_first'=>true,'navigation'=>'task-first'],
                'hub' => ['audience'=>'customer','density'=>'simple','customer_safe_required'=>true,'advanced_controls'=>false],
                'onboarding' => ['audience'=>'setup-operator','density'=>'progressive','progressive_disclosure'=>true,'navigation'=>'stepwise'],
                'object_permissions_checked_at_resolution' => true,
                'views_facets_actions_filtered_by_surface_and_capability' => true,
                'surface_switch_cannot_mutate_security_identity' => true,
                'direct_execution' => false,
            ],
            'contribution_discovery' => $this->discovery->snapshot()->jsonSerialize(),
            'domain_registry' => $this->domains->snapshot()->jsonSerialize(),
            'object_registry' => $this->objects->snapshot()->jsonSerialize(),
            'facet_registry' => $this->facets->snapshot()->jsonSerialize(),
            'view_registry' => $this->views->snapshot()->jsonSerialize(),
            'legacy_data_registry' => $this->legacyData->snapshot()->jsonSerialize(),
            'global_work_registry' => $this->globalWork->snapshot()->jsonSerialize(),
            'action_registry' => $this->actions->snapshot()->jsonSerialize(),
            'decision_provider_registry' => $this->decisions->snapshot()->jsonSerialize(),
            'collection_view_switching' => [
                'kinds' => ['cards', 'table', 'board', 'calendar', 'timeline', 'feed'],
                'same_authority_only' => true,
                'query_state_preserved' => true,
                'preference_store' => 'session',
                'authoritative_refetch_on_reprojection' => false,
                'map_projection' => 'spatial-workspace',
            ],
            'configuration_lifecycle_workspace' => [
                'authority' => 'source-extension',
                'stages' => ['draft','preview','validate','publish','history','rollback'],
                'manifest_opt_in' => 'component_hint=configuration-lifecycle',
                'metadata_only' => true,
                'version_state_owned_locally' => false,
                'validation_performed_locally' => false,
                'publish_performed_locally' => false,
                'rollback_performed_locally' => false,
                'actions_are_handoffs_only' => true,
                'direct_configuration_writes' => false,
            ],
            'working_sets_workspace_context' => array_replace([
                'authority' => 'titan-workspace-projects',
                'mixed_object_context' => true,
                'shared_context_for_people_and_ai' => true,
                'membership_grants_authorization' => false,
                'business_items_reauthorized' => true,
                'membership_removal_deletes_source_data' => false,
                'authoritative_payload_loading' => false,
                'direct_business_writes' => false,
            ], $this->workingSets->health()),
            'trust_governance_receipts' => array_replace([
                'authority' => 'source-governance-engines',
                'lifecycle' => ['proposal','risk-assurance-autonomy','approval','execution','receipt','rollback'],
                'risk_calculated_locally' => false,
                'assurance_calculated_locally' => false,
                'autonomy_calculated_locally' => false,
                'approval_state_owned_locally' => false,
                'receipt_state_owned_locally' => false,
                'actions_are_handoffs_only' => true,
                'titan_ai_approval_routes' => true,
                'titan_ai_receipt_rollback_route' => true,
                'auto_execute' => false,
                'direct_governance_writes' => false,
            ], $this->governance->health()),
            'decide_scenario_workspace' => [
                'authority' => 'source-engines',
                'view_kind' => 'scenario',
                'provider_contract' => 'providers.decisions',
                'layers' => ['observation', 'recommendation', 'scenario', 'choice'],
                'source_provenance_required' => true,
                'assumptions_visible' => true,
                'recommendation_is_not_execution' => true,
                'actions_are_intents_only' => true,
                'auto_execute' => false,
                'direct_decision_calculation' => false,
                'direct_execution' => false,
            ],
            'spatial_workspace' => [
                'authority' => 'titan-maps-intelligence',
                'manifest_opt_in_required' => true,
                'view_kind' => 'map',
                'supported_sections' => ['layers','pins','candidates','routes','territories','traffic'],
                'tenant_object_pin_recheck' => true,
                'bounded_geometry' => true,
                'invalid_geometry_policy' => 'omit-not-recalculate',
                'direct_spatial_calculations' => false,
                'actions_are_intents_only' => true,
                'direct_execution' => false,
            ],
            'context_inspector_command_surface' => [
                'authority' => 'presentation-only',
                'inspector_container' => 'drawer',
                'object_payload_loading' => false,
                'facet_loading' => 'lazy',
                'context_preserved' => true,
                'full_workspace_optional' => true,
                'command_kinds' => ['ask', 'navigate', 'inspect', 'workspace', 'action'],
                'registry_and_current_context_search_only' => true,
                'direct_execution' => false,
            ],
            'global_work_trays' => [
                'trays' => ['continue', 'attention', 'approvals', 'inbox', 'sync'],
                'authority' => 'source-engines',
                'aggregate_references_only' => true,
                'tenant_recheck' => true,
                'capability_recheck' => true,
                'deterministic_deduplication' => true,
                'source_health' => true,
                'direct_execution' => false,
            ],
            'object_workspace' => [
                'facet_loading' => 'lazy',
                'permission_filtering' => true,
                'hub_customer_safety' => true,
                'authoritative_payload_loading' => false,
            ],
            'read_authority' => [
                'authority_source' => 'declared-view-data-source',
                'supported_modes' => ['read-model', 'capability', 'legacy-route'],
                'tenant_user_trace_provenance' => true,
                'request_local_cache' => true,
                'cross_tenant_cache' => false,
                'bounded_queries' => true,
                'direct_domain_queries' => false,
            ],
            'legacy_data_mode' => [
                'projection' => 'deep-link',
                'copies_legacy_query_logic' => false,
                'preserves_source_route_authorization' => true,
                'hub_enabled' => false,
            ],
            'interaction_engine_adapter' => array_replace([
                'authority' => 'titan-interaction-engine',
                'presentation_only' => true,
                'supported_render_modes' => ['chat', 'panel', 'full-workspace'],
                'copies_workflow_logic' => false,
                'copies_session_data' => false,
                'direct_execution' => false,
                'resume_by_persisted_session' => true,
            ], $this->interactionEngine->health()),
            'presentation_model' => [
                'version' => '1.0',
                'authority' => 'presentation-only',
                'builder_adapter' => true,
                'builder_optional' => true,
                'component_vocabulary_source' => $this->components->source(),
                'component_count' => count($this->components->ids()),
                'unknown_component_policy' => 'safe-fallback',
                'builder_actions_cross_boundary' => false,
                'deterministic_serialization' => true,
            ],
        ];
    }

    public function boundaries(): array
    {
        return [
            'presentation_authority' => true,
            'business_data_authority' => false,
            'workflow_authority' => false,
            'component_vocabulary_authority' => false,
            'spatial_authority' => false,
            'governance_authority' => false,
            'direct_business_writes' => false,
            'mutations' => 'governed-capability-or-interaction-only',
        ];
    }
}

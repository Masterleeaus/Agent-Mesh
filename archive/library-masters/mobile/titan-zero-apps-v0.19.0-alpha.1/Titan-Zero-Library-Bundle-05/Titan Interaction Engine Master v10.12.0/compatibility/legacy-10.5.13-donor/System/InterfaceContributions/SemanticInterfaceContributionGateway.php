<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\InterfaceContributions;

use App\Extensions\InteractionEngine\System\Contracts\TitanAppsInterfaceContributionContract;
use App\Extensions\InteractionEngine\System\Surfaces\SurfaceWizardPolicy;
use InvalidArgumentException;

final class SemanticInterfaceContributionGateway implements TitanAppsInterfaceContributionContract
{
    public const SCHEMA = 'titan.apps.interface-contribution/1';

    private readonly SurfaceProjectionRegistry $projections;

    public function __construct(
        private readonly SurfaceWizardPolicy $surfaces,
        ?SurfaceProjectionRegistry $projections = null,
    ) {
        $this->projections = $projections ?? new SurfaceProjectionRegistry();
    }

    public function normalize(array $structuredOutput, array $trustedContext): array
    {
        $companyId = trim((string) ($trustedContext['company_id'] ?? ''));
        if ($companyId === '') {
            throw new InvalidArgumentException('Interface contribution requires trusted company_id.');
        }

        foreach (['tenant_id', 'tenant_company_id', 'tenantId'] as $legacyTenantKey) {
            if (array_key_exists($legacyTenantKey, $trustedContext)) {
                $legacy = trim((string) $trustedContext[$legacyTenantKey]);
                if ($legacy !== '' && $legacy !== $companyId) {
                    throw new InvalidArgumentException('Legacy tenant identifier conflicts with canonical company_id.');
                }
            }
        }

        $outputCompanyId = isset($structuredOutput['company_id']) ? trim((string) $structuredOutput['company_id']) : '';
        if ($outputCompanyId !== '' && $outputCompanyId !== $companyId) {
            throw new InvalidArgumentException('Structured output company_id conflicts with trusted company_id.');
        }

        $intent = is_array($structuredOutput['presentation_intent'] ?? null)
            ? $structuredOutput['presentation_intent']
            : [];
        $requestedSurface = trim((string) ($intent['surface'] ?? $trustedContext['surface'] ?? 'zero')) ?: 'zero';
        $requestedJourney = isset($intent['journey']) && is_scalar($intent['journey']) ? trim((string) $intent['journey']) : null;
        $resolved = $this->surfaces->resolve($requestedSurface, $requestedJourney !== '' ? $requestedJourney : null);
        if (! in_array($resolved['surface'], ['zero', 'go', 'hub'], true)) {
            throw new InvalidArgumentException('Interface contribution surface must resolve to zero, go, or hub.');
        }

        $source = strtolower(trim((string) ($trustedContext['source'] ?? 'workforce')));
        if ($source === '' || ! preg_match('/^[a-z0-9][a-z0-9._-]{1,127}$/', $source)) {
            throw new InvalidArgumentException('Interface contribution source must be a registered semantic source identifier.');
        }

        $components = [];
        foreach ((array) ($structuredOutput['recommended_components'] ?? []) as $component) {
            $componentId = is_array($component)
                ? ($component['component_id'] ?? $component['id'] ?? null)
                : $component;
            if (! is_scalar($componentId)) continue;
            $componentId = trim((string) $componentId);
            if ($componentId === '' || ! preg_match('/^[a-z0-9][a-z0-9._-]{1,127}$/', $componentId)) continue;
            $components[$componentId] = [
                'component_id' => $componentId,
                'semantic_only' => true,
                'provider_owned_rendering' => false,
            ];
        }

        $actions = [];
        foreach ((array) ($structuredOutput['recommended_actions'] ?? []) as $index => $action) {
            if (! is_array($action)) continue;
            $capability = isset($action['capability']) && is_scalar($action['capability'])
                ? trim((string) $action['capability'])
                : null;
            $actionId = isset($action['action_id']) && is_scalar($action['action_id'])
                ? trim((string) $action['action_id'])
                : 'recommendation-'.($index + 1);
            $label = isset($action['label']) && is_scalar($action['label'])
                ? trim((string) $action['label'])
                : ($capability !== null && $capability !== '' ? 'Review '.$capability : 'Review recommendation');
            $parameters = is_array($action['parameters'] ?? null) ? $action['parameters'] : [];
            $actions[] = [
                'action_id' => $actionId !== '' ? $actionId : 'recommendation-'.($index + 1),
                'label' => $label,
                'capability' => $capability !== '' ? $capability : null,
                'parameters' => $this->sanitizePresentedParameters($parameters, $companyId),
                'execution_authority_granted' => false,
                'requires_governed_execution' => true,
            ];
        }

        $capabilityResult = is_array($structuredOutput['capability_result'] ?? null) ? $structuredOutput['capability_result'] : [];
        $projection = $this->projections->project(
            $source,
            $resolved['surface'],
            is_array($capabilityResult['data'] ?? null) ? $capabilityResult['data'] : [],
        );
        $capabilityResult['data'] = $projection['data'];
        $capabilityResult['projection_id'] = $projection['projection_id'];
        $capabilityResult['raw_provider_fields_included'] = false;

        return [
            'schema' => self::SCHEMA,
            'company_id' => $companyId,
            'source' => $source,
            'surface' => $resolved['surface'],
            'journey' => $resolved['journey'],
            'purpose' => isset($intent['purpose']) && is_scalar($intent['purpose']) ? trim((string) $intent['purpose']) : null,
            'components' => array_values($components),
            'actions' => $actions,
            'capability_result' => $capabilityResult,
            'projection' => [
                'projection_id' => $projection['projection_id'],
                'source' => $projection['source'],
                'surface' => $projection['surface'],
                'default_deny' => $projection['default_deny'],
            ],
            'confidence' => is_numeric($structuredOutput['confidence'] ?? null) ? max(0.0, min(1.0, (float) $structuredOutput['confidence'])) : null,
            'evidence' => is_array($structuredOutput['evidence'] ?? null) ? $structuredOutput['evidence'] : [],
            'ownership' => [
                'composition_and_rendering' => 'titan_apps_interface_runtime',
                'editing_and_publishing' => 'titan_apps_builder',
                'provider_business_truth' => 'source_provider',
                'interaction_orchestration' => 'titan_apps_interaction_engine',
            ],
            'safety' => [
                'semantic_components_only' => true,
                'arbitrary_executable_ui_allowed' => false,
                'provider_ui_ownership_allowed' => false,
                'execution_authority_granted' => false,
                'command_bus_recheck_required' => true,
                'company_boundary' => 'company_id',
                'registered_projection_required' => true,
                'raw_provider_fields_allowed' => false,
            ],
        ];
    }

    /** @param array<string,mixed> $parameters @return array<string,mixed> */
    private function sanitizePresentedParameters(array $parameters, string $companyId): array
    {
        $out = [];
        foreach ($parameters as $key => $value) {
            $name = (string) $key;
            if (in_array($name, ['tenant_id','tenant_company_id','tenantId'], true)) {
                continue;
            }
            if ($name === 'company_id') {
                $candidate = is_scalar($value) ? trim((string) $value) : '';
                if ($candidate !== '' && $candidate !== $companyId) {
                    throw new InvalidArgumentException('Presented action company_id conflicts with trusted company_id.');
                }
                $out[$name] = $companyId;
                continue;
            }
            if (is_array($value)) {
                $out[$key] = $this->sanitizePresentedParameters($value, $companyId);
                continue;
            }
            $out[$key] = $value;
        }
        return $out;
    }
}


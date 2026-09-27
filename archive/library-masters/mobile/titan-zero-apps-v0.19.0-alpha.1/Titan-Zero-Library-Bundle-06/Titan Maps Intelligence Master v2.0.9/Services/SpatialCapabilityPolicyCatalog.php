<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

final class SpatialCapabilityPolicyCatalog
{
    public const CANONICAL = [
        'location.geocode',
        'territory.lookup',
        'territory.validate',
        'route.estimate',
        'route.compare',
        'job.travel_context',
        'service_area.check',
        'nearby.search',
    ];

    public function policy(string $capabilityId): array
    {
        $id = trim($capabilityId);
        $mutationClass = $this->mutationClass($id);
        $providerNetwork = $this->usesNetworkProvider($id);
        $crossExtension = $mutationClass === 'authoritative_mutation';
        $mapsMutation = $mutationClass === 'maps_mutation';

        return [
            'owner' => 'titan-maps-intelligence',
            'risk_profile' => $crossExtension ? 'high' : ($mapsMutation ? 'moderate' : ($providerNetwork ? 'moderate' : 'low')),
            'autonomy_requirement' => $crossExtension ? 'ASSIST' : ($mapsMutation ? 'SEMI_AUTO' : 'SUGGEST'),
            'evidence_requirements' => $this->evidenceRequirements($id),
            'offline_policy' => $this->offlinePolicy($id, $mutationClass, $providerNetwork),
            'reversibility' => $crossExtension ? 'command_receipt_dependent' : ($mapsMutation ? 'maps_state_reversible_or_archivable' : 'read_only'),
            'idempotency_strategy' => $crossExtension ? 'command_bus_idempotency_key' : ($mapsMutation ? 'tenant_scoped_operation_key' : ($providerNetwork ? 'request_signature_and_provider_usage_receipt' : 'not_applicable_read')),
            'mutation_class' => $mutationClass,
        ];
    }

    private function mutationClass(string $id): string
    {
        foreach (['candidate.promote','resource-fallback.promote'] as $needle) {
            if (str_contains($id, $needle)) return 'authoritative_mutation';
        }
        foreach (['candidate.approve','candidate.reject','dispatch.decide','dispatch.weights.update','territory.manage','route-plan.manage','resource-fallback.decide','provider.quota.override'] as $needle) {
            if (str_contains($id, $needle)) return 'maps_mutation';
        }
        if (in_array($id, self::CANONICAL, true) || str_contains($id, 'search.businesses') || str_contains($id, 'search.cancel') || str_contains($id, 'candidate.classify') || str_contains($id, 'territory-analytics.run') || str_contains($id, 'resource-fallback.start') || str_contains($id, 'route.calculate') || str_contains($id, 'travel-matrix.calculate')) {
            return 'maps_observation_write';
        }
        return 'read_only';
    }

    private function usesNetworkProvider(string $id): bool
    {
        foreach (['location.geocode','route.estimate','route.compare','job.travel_context','nearby.search','search.businesses','route.calculate','travel-matrix.calculate','nearest-resource.find','dispatch.recommend','resource-fallback.start'] as $needle) {
            if (str_contains($id, $needle)) return true;
        }
        return false;
    }

    private function evidenceRequirements(string $id): array
    {
        if (str_contains($id, 'job.travel_context')) return ['authorised_job_reference','canonical_map_location','route_or_fallback_provenance','territory_evidence'];
        if (str_contains($id, 'territory') || str_contains($id, 'service_area')) return ['target_location','territory_rule_version'];
        if (str_contains($id, 'route') || str_contains($id, 'matrix')) return ['origin','destination','provider_or_fallback_provenance'];
        if (str_contains($id, 'nearby') || str_contains($id, 'nearest-resource')) return ['origin','resource_location_provenance'];
        if (str_contains($id, 'promote') || str_contains($id, 'dispatch.decide')) return ['human_confirmation','authoritative_target_reference','governance_receipts'];
        return ['authorised_tenant_context'];
    }

    private function offlinePolicy(string $id, string $mutationClass, bool $providerNetwork): string
    {
        if ($mutationClass === 'authoritative_mutation' || str_contains($id,'provider.quota.override') || $id === 'route.estimate') return 'OFFLINE_BLOCKED';
        if ($mutationClass === 'maps_mutation') return 'OFFLINE_PREPARE_ONLY';
        foreach (['territory.lookup','territory.validate','service_area.check'] as $offlineRead) {
            if ($id === $offlineRead) return 'OFFLINE_EXECUTE';
        }
        return $providerNetwork ? 'OFFLINE_PREPARE_ONLY' : 'OFFLINE_EXECUTE';
    }
}

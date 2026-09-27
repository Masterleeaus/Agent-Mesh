<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\DTO\ProviderUsage;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Models\MapsUsageRecord;

final class ProviderUsageService
{
    public function record(string $companyId, ProviderUsage $usage, array $context = []): MapsUsageRecord
    {
        $companyId = trim($companyId);
        if ($companyId === '') {
            throw MapsIntelligenceException::fromCode('MAPS_TENANT_DENIED', 'Provider usage requires an authorised company ID.');
        }

        return MapsUsageRecord::query()->create([
            'company_id' => $companyId,
            'branch_id' => $context['branch_id'] ?? null,
            'workspace_id' => $context['workspace_id'] ?? null,
            'provider' => $usage->provider,
            'operation' => $usage->operation,
            'request_count' => $usage->requestCount,
            'result_count' => $usage->resultCount,
            'billable_units' => $usage->billableUnits,
            'estimated_cost' => $usage->estimatedCost,
            'currency' => $usage->currency,
            'discovery_search_id' => $context['discovery_search_id'] ?? null,
            'user_id' => $context['user_id'] ?? null,
            'agent_id' => $context['agent_id'] ?? null,
            'recorded_at' => $context['recorded_at'] ?? now(),
        ]);
    }

    /** @param list<ProviderUsage> $records */
    public function summarise(array $records): array
    {
        if ($records === []) {
            return ['request_count' => 0, 'result_count' => 0, 'billable_units' => 0.0, 'estimated_cost' => 0.0, 'currency' => null];
        }

        $currency = $records[0]->currency;
        $summary = ['request_count' => 0, 'result_count' => 0, 'billable_units' => 0.0, 'estimated_cost' => 0.0, 'currency' => $currency];
        foreach ($records as $record) {
            if ($record->currency !== $currency) {
                throw MapsIntelligenceException::fromCode('MAPS_USAGE_CURRENCY_MISMATCH', 'Provider usage records must share one currency before aggregation.');
            }
            $summary['request_count'] += $record->requestCount;
            $summary['result_count'] += $record->resultCount;
            $summary['billable_units'] += $record->billableUnits;
            $summary['estimated_cost'] += $record->estimatedCost;
        }

        return $summary;
    }
}

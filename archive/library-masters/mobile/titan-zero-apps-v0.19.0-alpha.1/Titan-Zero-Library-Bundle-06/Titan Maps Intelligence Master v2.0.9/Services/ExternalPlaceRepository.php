<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\DTO\ExternalPlaceData;
use App\Extensions\TitanMapsIntelligence\Events\ExternalPlaceObserved;
use App\Extensions\TitanMapsIntelligence\Models\ExternalPlace;
use App\Extensions\TitanMapsIntelligence\Models\FieldObservation;
use DateTimeImmutable;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Facades\DB;

final class ExternalPlaceRepository
{
    public function __construct(
        private readonly PlaceCanonicalizer $canonicalizer,
        private readonly ProvenanceService $provenance,
        private readonly Dispatcher $events,
    ) {}

    public function upsertObservation(string $companyId, ExternalPlaceData $place, array $context = []): ExternalPlace
    {
        return DB::transaction(function () use ($companyId, $place, $context): ExternalPlace {
            $now = new DateTimeImmutable();
            $canonicalKey = $this->canonicalizer->canonicalKey($place);
            $record = ExternalPlace::query()->firstOrNew([
                'company_id' => $companyId,
                'provider' => $place->provider,
                'provider_place_id' => $place->providerPlaceId,
            ]);
            $record->fill(array_merge($place->toArray(), [
                'company_id' => $companyId,
                'branch_id' => $context['branch_id'] ?? null,
                'workspace_id' => $context['workspace_id'] ?? null,
                'canonical_key' => $canonicalKey,
                'first_observed_at' => $record->exists ? $record->first_observed_at : $now,
                'last_observed_at' => $now,
                'last_verified_at' => $now,
                'confidence' => 0.8,
                'data_freshness' => 'observed',
                'provider_terms_metadata' => $context['provider_terms_metadata'] ?? [],
            ]));
            $record->save();

            foreach ($this->provenance->observations($place, $now) as $observation) {
                FieldObservation::query()->create([
                    'company_id' => $companyId,
                    'branch_id' => $context['branch_id'] ?? null,
                    'workspace_id' => $context['workspace_id'] ?? null,
                    'external_place_id' => $record->getKey(),
                    'field' => $observation['field'],
                    'observed_value' => ['value' => $observation['value']],
                    'provider' => $observation['provider'],
                    'source_url' => $observation['source_url'],
                    'observed_at' => $observation['observed_at'],
                    'confidence' => $observation['confidence'],
                    'restrictions' => $observation['restrictions'],
                    'observation_type' => $observation['observation_type'],
                ]);
            }

            $this->events->dispatch(new ExternalPlaceObserved(
                companyId: $companyId,
                userId: $context['user_id'] ?? null,
                agentId: $context['agent_id'] ?? null,
                conversationId: $context['conversation_id'] ?? null,
                correlationId: $context['correlation_id'] ?? null,
                payload: ['external_place_id' => $record->getKey(), 'provider' => $place->provider],
            ));

            return $record;
        });
    }
}

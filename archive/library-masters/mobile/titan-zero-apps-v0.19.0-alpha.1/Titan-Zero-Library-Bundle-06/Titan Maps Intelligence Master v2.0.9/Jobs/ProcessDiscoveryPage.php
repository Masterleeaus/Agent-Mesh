<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Jobs;

use App\Extensions\TitanMapsIntelligence\Contracts\QueueTenantContext;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\PlaceSearchRequest;
use App\Extensions\TitanMapsIntelligence\Enums\SearchStatus;
use App\Extensions\TitanMapsIntelligence\Events\CandidateCreated;
use App\Extensions\TitanMapsIntelligence\Events\ProviderRateLimited;
use App\Extensions\TitanMapsIntelligence\Events\ProviderUsageRecorded;
use App\Extensions\TitanMapsIntelligence\Events\SearchCompleted;
use App\Extensions\TitanMapsIntelligence\Events\SearchFailed;
use App\Extensions\TitanMapsIntelligence\Events\SearchProgressed;
use App\Extensions\TitanMapsIntelligence\Exceptions\ProviderException;
use App\Extensions\TitanMapsIntelligence\Models\DiscoveryCandidate;
use App\Extensions\TitanMapsIntelligence\Models\DiscoveryRun;
use App\Extensions\TitanMapsIntelligence\Models\DiscoverySearch;
use App\Extensions\TitanMapsIntelligence\Models\MapsSuppression;
use App\Extensions\TitanMapsIntelligence\Models\MapsUsageRecord;
use App\Extensions\TitanMapsIntelligence\Providers\PlacesProviderRegistry;
use App\Extensions\TitanMapsIntelligence\Services\CandidateClassificationService;
use App\Extensions\TitanMapsIntelligence\Services\DiscoveryRunService;
use App\Extensions\TitanMapsIntelligence\Services\ExternalPlaceRepository;
use App\Extensions\TitanMapsIntelligence\Services\GeoDistanceService;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;
use App\Extensions\TitanMapsIntelligence\Services\ProviderRankingService;
use App\Extensions\TitanMapsIntelligence\Services\ProviderHealthService;
use App\Extensions\TitanMapsIntelligence\Services\ProviderQuotaGuard;
use App\Extensions\TitanMapsIntelligence\Services\ResultLimitService;
use App\Extensions\TitanMapsIntelligence\Services\SuppressionService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

final class ProcessDiscoveryPage implements ShouldQueue
{
    public bool $afterCommit = true;

    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 120;

    public function __construct(
        public readonly string $searchId,
        public readonly string $companyId,
        public readonly string $runId,
    ) {}

    public function handle(
        PlacesProviderRegistry $providers,
        DiscoveryRunService $runs,
        ExternalPlaceRepository $places,
        CandidateClassificationService $classifier,
        SuppressionService $suppression,
        ProviderRankingService $ranking,
        GeoDistanceService $distance,
        ResultLimitService $limits,
        MapsConfiguration $configuration,
        Dispatcher $events,
        QueueTenantContext $tenantContext,
        ProviderQuotaGuard $quota,
        ProviderHealthService $health,
    ): void {
        $tenantContext->run($this->companyId, function () use ($providers, $runs, $places, $classifier, $suppression, $ranking, $distance, $limits, $configuration, $events, $quota, $health): void {
            $this->executeWithinTenant($providers, $runs, $places, $classifier, $suppression, $ranking, $distance, $limits, $configuration, $events, $quota, $health);
        });
    }

    private function executeWithinTenant(
        PlacesProviderRegistry $providers,
        DiscoveryRunService $runs,
        ExternalPlaceRepository $places,
        CandidateClassificationService $classifier,
        SuppressionService $suppression,
        ProviderRankingService $ranking,
        GeoDistanceService $distance,
        ResultLimitService $limits,
        MapsConfiguration $configuration,
        Dispatcher $events,
        ProviderQuotaGuard $quota,
        ProviderHealthService $health,
    ): void {
        $search = DiscoverySearch::query()->where('company_id', $this->companyId)->whereKey($this->searchId)->firstOrFail();
        $run = DiscoveryRun::query()->where('company_id', $this->companyId)->whereKey($this->runId)->firstOrFail();
        if ($search->status === SearchStatus::Cancelled->value || $search->status === SearchStatus::Completed->value) {
            return;
        }

        try {
            $existingProcessed = DiscoveryCandidate::query()
                ->where('company_id', $this->companyId)
                ->where('discovery_search_id', $search->getKey())
                ->count();
            $remaining = $limits->remaining((int) $search->maximum_results, $existingProcessed);
            if ($remaining === 0) {
                $runs->checkpoint($run, ['current_stage' => 'completed', 'completed_at' => now()]);
                $search->forceFill(['status' => SearchStatus::Completed->value, 'completed_at' => now()])->save();
                $events->dispatch(new SearchCompleted($this->companyId, $search->requested_by_user_id, conversationId: $search->conversation_id, payload: ['search_id' => $search->getKey(), 'processed' => $existingProcessed]));
                return;
            }
            $quota->enforceForCompany($this->companyId, (string)$run->provider, 'places_search', false);
            $provider = $providers->get($run->provider, $this->companyId);
            $request = new PlaceSearchRequest(
                query: $search->query,
                maximumResults: min($configuration->maximumProviderPageSize(), $remaining),
                languageCode: $search->language,
                regionCode: $search->country,
                locationBias: $search->latitude !== null && $search->longitude !== null
                    ? new Coordinates((float) $search->latitude, (float) $search->longitude)
                    : null,
                radiusMetres: $search->radius_metres === null ? null : (float) $search->radius_metres,
                includedType: $search->category,
                openNow: (bool) ($search->filters['open_now'] ?? false),
                minimumRating: isset($search->filters['minimum_rating']) ? (float) $search->filters['minimum_rating'] : null,
                pageToken: $run->cursor,
            );
            $page = $provider->search($request);
            $health->recordSuccessForCompany($this->companyId, (string)$run->provider);
            $skipped = 0;
            $duplicates = 0;
            $suppressions = MapsSuppression::query()
                ->where('company_id', $this->companyId)
                ->where(static fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()))
                ->get(['suppression_type', 'normalised_value'])
                ->toArray();
            $pagePlaces = $limits->take($page->places, $remaining);
            foreach ($pagePlaces as $placeData) {
                $place = $places->upsertObservation($this->companyId, $placeData, [
                    'branch_id' => $search->branch_id,
                    'workspace_id' => $search->workspace_id,
                    'user_id' => $search->requested_by_user_id,
                    'conversation_id' => $search->conversation_id,
                ]);
                if ($suppression->matches($suppressions, $place->toArray())) {
                    $skipped++;
                    continue;
                }
                $classification = $classifier->classify($place->toArray(), $search->purpose);
                $distanceKm = null;
                if ($search->latitude !== null && $search->longitude !== null && $place->latitude !== null && $place->longitude !== null) {
                    $distanceKm = $distance->kilometres((float) $search->latitude, (float) $search->longitude, (float) $place->latitude, (float) $place->longitude);
                }
                $categoryMatch = $search->category === null
                    ? $configuration->rankingUncategorisedMatchScore()
                    : (in_array($search->category, (array) $place->categories, true) || $search->category === $place->primary_category ? 1.0 : 0.0);
                $ranked = $ranking->rank([
                    'distance_km' => $distanceKm ?? $configuration->rankingMissingDistanceKm(),
                    'category_match' => $categoryMatch,
                    'rating' => $place->rating,
                    'review_count' => $place->review_count,
                    'open_now' => $place->currently_open,
                    'phone' => $place->phone,
                    'website' => $place->website,
                    'data_freshness' => 1.0,
                ]);
                $candidate = DiscoveryCandidate::query()->firstOrCreate([
                    'company_id' => $this->companyId,
                    'discovery_search_id' => $search->getKey(),
                    'external_place_id' => $place->getKey(),
                    'candidate_type' => $classification['type'],
                ], [
                    'branch_id' => $search->branch_id,
                    'workspace_id' => $search->workspace_id,
                    'lifecycle_status' => 'new',
                    'relevance_score' => $ranked->score,
                    'confidence_score' => $classification['confidence'],
                    'classification_evidence' => $classification['evidence'],
                    'review_status' => 'pending',
                ]);
                if ($candidate->wasRecentlyCreated) {
                    $events->dispatch(new CandidateCreated($this->companyId, $search->requested_by_user_id, conversationId: $search->conversation_id, payload: ['candidate_id' => $candidate->getKey(), 'search_id' => $search->getKey()]));
                } else {
                    $duplicates++;
                }
            }

            if ($page->usage !== null) {
                MapsUsageRecord::query()->create([
                    'company_id' => $this->companyId,
                    'branch_id' => $search->branch_id,
                    'workspace_id' => $search->workspace_id,
                    'provider' => $page->usage->provider,
                    'operation' => $page->usage->operation,
                    'request_count' => $page->usage->requestCount,
                    'result_count' => $page->usage->resultCount,
                    'billable_units' => $page->usage->billableUnits,
                    'estimated_cost' => $page->usage->estimatedCost,
                    'currency' => $page->usage->currency,
                    'discovery_search_id' => $search->getKey(),
                    'user_id' => $search->requested_by_user_id,
                    'recorded_at' => now(),
                ]);
                $events->dispatch(new ProviderUsageRecorded($this->companyId, $search->requested_by_user_id, payload: ['search_id' => $search->getKey(), 'provider' => $page->usage->provider]));
            }

            $newProcessed = DiscoveryCandidate::query()
                ->where('company_id', $this->companyId)
                ->where('discovery_search_id', $search->getKey())
                ->count();
            $runs->checkpoint($run, [
                'cursor' => $page->nextPageToken,
                'results_discovered' => (int) $run->results_discovered + count($pagePlaces),
                'results_processed' => $newProcessed,
                'results_skipped' => (int) $run->results_skipped + $skipped,
                'duplicates_detected' => (int) $run->duplicates_detected + $duplicates,
                'current_stage' => $page->nextPageToken === null ? 'completed' : 'paging',
                'completed_at' => $page->nextPageToken === null ? now() : null,
            ]);
            $events->dispatch(new SearchProgressed($this->companyId, $search->requested_by_user_id, conversationId: $search->conversation_id, payload: ['search_id' => $search->getKey(), 'processed' => $newProcessed]));

            if ($page->nextPageToken !== null && $newProcessed < (int) $search->maximum_results) {
                self::dispatch($this->searchId, $this->companyId, $this->runId);
                return;
            }

            $search->forceFill(['status' => SearchStatus::Completed->value, 'completed_at' => now()])->save();
            $events->dispatch(new SearchCompleted($this->companyId, $search->requested_by_user_id, conversationId: $search->conversation_id, payload: ['search_id' => $search->getKey(), 'processed' => $newProcessed]));
        } catch (ProviderException $exception) {
            $health->recordFailureForCompany($this->companyId, (string)$run->provider, $exception);
            $retryAfter = $exception->errorCode() === 'MAPS_PROVIDER_RATE_LIMITED' ? now()->addMinute() : null;
            $runs->checkpoint($run, [
                'failures' => (int) $run->failures + 1,
                'failure_code' => $exception->errorCode(),
                'safe_failure_details' => $exception->getMessage(),
                'retry_after' => $retryAfter,
                'current_stage' => $retryAfter === null ? 'failed' : 'rate_limited',
            ]);
            if ($retryAfter !== null) {
                $events->dispatch(new ProviderRateLimited($this->companyId, $search->requested_by_user_id, payload: ['search_id' => $search->getKey(), 'retry_after' => $retryAfter->toAtomString()]));
                $this->release(60);
                return;
            }
            $search->forceFill(['status' => SearchStatus::Failed->value])->save();
            $events->dispatch(new SearchFailed($this->companyId, $search->requested_by_user_id, payload: ['search_id' => $search->getKey(), 'code' => $exception->errorCode()]));
            throw $exception;
        } catch (Throwable $exception) {
            $runs->checkpoint($run, ['failures' => (int) $run->failures + 1, 'failure_code' => 'MAPS_SEARCH_FAILED', 'safe_failure_details' => 'Search processing failed.', 'current_stage' => 'failed']);
            $search->forceFill(['status' => SearchStatus::Failed->value])->save();
            $events->dispatch(new SearchFailed($this->companyId, $search->requested_by_user_id, payload: ['search_id' => $search->getKey(), 'code' => 'MAPS_SEARCH_FAILED']));
            throw $exception;
        }
    
    }
}

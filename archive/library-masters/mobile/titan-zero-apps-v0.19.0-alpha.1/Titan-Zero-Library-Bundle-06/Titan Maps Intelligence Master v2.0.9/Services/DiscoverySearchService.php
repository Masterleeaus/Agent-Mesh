<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\DTO\PlaceSearchRequest;
use App\Extensions\TitanMapsIntelligence\Enums\SearchStatus;
use App\Extensions\TitanMapsIntelligence\Events\SearchCancelled;
use App\Extensions\TitanMapsIntelligence\Events\SearchCreated;
use App\Extensions\TitanMapsIntelligence\Jobs\ExecuteDiscoverySearch;
use App\Extensions\TitanMapsIntelligence\Models\DiscoverySearch;
use Illuminate\Contracts\Events\Dispatcher;

final class DiscoverySearchService
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly PermissionAuthorizer $authorizer,
        private readonly Dispatcher $events,
        private readonly MapsConfiguration $configuration,
    ) {}

    public function create(PlaceSearchRequest $request, array $metadata): DiscoverySearch
    {
        $companyId = $this->context->companyId();
        $userId = $this->context->userId();
        $this->authorizer->authorize($userId, $companyId, 'titan-maps-intelligence.search.create', ['purpose' => $metadata['purpose'] ?? null]);
        $this->configuration->assertSearchLimits($request->maximumResults, $request->radiusMetres);

        $providerStrategy = (array) ($metadata['provider_strategy'] ?? []);
        $providerStrategy['configuration_version'] = $this->configuration->version();

        $search = DiscoverySearch::query()->create([
            'company_id' => $companyId,
            'branch_id' => $this->context->branchId(),
            'workspace_id' => $this->context->workspaceId(),
            'requested_by_user_id' => $userId,
            'conversation_id' => $metadata['conversation_id'] ?? null,
            'purpose' => (string) ($metadata['purpose'] ?? 'provider_discovery'),
            'query' => $request->query,
            'category' => $request->includedType,
            'categories' => $request->includedType === null ? [] : [$request->includedType],
            'latitude' => $request->locationBias?->latitude,
            'longitude' => $request->locationBias?->longitude,
            'radius_metres' => $request->radiusMetres,
            'language' => $request->languageCode,
            'country' => $request->regionCode,
            'filters' => ['open_now' => $request->openNow, 'minimum_rating' => $request->minimumRating],
            'provider_strategy' => $providerStrategy,
            'maximum_results' => $request->maximumResults,
            'status' => SearchStatus::Queued->value,
        ]);

        $this->events->dispatch(new SearchCreated($companyId, $userId, $metadata['agent_id'] ?? null, $metadata['conversation_id'] ?? null, $metadata['correlation_id'] ?? null, null, ['search_id' => $search->getKey()]));
        ExecuteDiscoverySearch::dispatch($search->getKey(), $companyId);

        return $search;
    }

    public function find(string $searchId): ?DiscoverySearch
    {
        $companyId = $this->context->companyId();
        $this->authorizer->authorize($this->context->userId(), $companyId, 'titan-maps-intelligence.search.read', ['search_id' => $searchId]);
        return DiscoverySearch::query()->where('company_id', $companyId)->whereKey($searchId)->first();
    }

    public function cancel(string $searchId): void
    {
        $companyId = $this->context->companyId();
        $userId = $this->context->userId();
        $this->authorizer->authorize($userId, $companyId, 'titan-maps-intelligence.search.cancel', ['search_id' => $searchId]);
        $search = DiscoverySearch::query()->where('company_id', $companyId)->whereKey($searchId)->firstOrFail();
        $search->forceFill(['status' => SearchStatus::Cancelled->value, 'cancelled_at' => now()])->save();
        $this->events->dispatch(new SearchCancelled($companyId, $userId, payload: ['search_id' => $searchId]));
    }
}

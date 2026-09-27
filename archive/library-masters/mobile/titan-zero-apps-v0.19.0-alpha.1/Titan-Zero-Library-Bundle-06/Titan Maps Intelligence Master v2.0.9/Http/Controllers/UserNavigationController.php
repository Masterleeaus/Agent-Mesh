<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Models\DiscoveryCandidate;
use App\Extensions\TitanMapsIntelligence\Models\DiscoverySearch;
use App\Extensions\TitanMapsIntelligence\Models\DispatchRecommendation;
use App\Extensions\TitanMapsIntelligence\Models\GeographicPricingSignal;
use App\Extensions\TitanMapsIntelligence\Models\MapGeofence;
use App\Extensions\TitanMapsIntelligence\Models\MapGeofenceEvent;
use App\Extensions\TitanMapsIntelligence\Models\MapLocation;
use App\Extensions\TitanMapsIntelligence\Models\MapLocationPing;
use App\Extensions\TitanMapsIntelligence\Models\MapProviderConnection;
use App\Extensions\TitanMapsIntelligence\Models\MapsUsageRecord;
use App\Extensions\TitanMapsIntelligence\Models\MapWorkerTrackingState;
use App\Extensions\TitanMapsIntelligence\Models\RoutePlan;
use App\Extensions\TitanMapsIntelligence\Models\RouteSnapshot;
use App\Extensions\TitanMapsIntelligence\Models\ServiceTerritory;
use App\Extensions\TitanMapsIntelligence\Models\TerritoryAnalysis;
use App\Extensions\TitanMapsIntelligence\Models\TerritoryEvaluation;
use App\Extensions\TitanMapsIntelligence\Models\TravelMatrixSnapshot;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;
use App\Extensions\TitanMapsIntelligence\Services\MapViewDataService;
use App\Extensions\TitanMapsIntelligence\Services\WorkerLocationVisibilityPolicy;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class UserNavigationController
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly MapViewDataService $mapViews,
        private readonly MapsConfiguration $configuration,
        private readonly WorkerLocationVisibilityPolicy $workerVisibility,
    ) {}

    public function __invoke(Request $request): View
    {
        $companyId = $this->context->companyId();
        $page = (string) $request->route('maps_page', 'location.index');
        $definition = self::pageDefinition($page);
        $workspace = self::workspaceDefinition($page);

        $counts = [
            'searches' => DiscoverySearch::query()->forCompany($companyId)->count(),
            'candidates' => DiscoveryCandidate::query()->forCompany($companyId)->count(),
            'supplier_candidates' => DiscoveryCandidate::query()->forCompany($companyId)->where('candidate_type', 'supplier_candidate')->count(),
            'contractor_candidates' => DiscoveryCandidate::query()->forCompany($companyId)->whereIn('candidate_type', ['contractor_candidate','provider_candidate','emergency_provider'])->count(),
            'competitor_candidates' => DiscoveryCandidate::query()->forCompany($companyId)->where('candidate_type', 'competitor')->count(),
            'locations' => MapLocation::query()->forCompany($companyId)->where('reference_type', '!=', 'worker')->count(),
            'branches' => MapLocation::query()->forCompany($companyId)->where('reference_type', 'branch')->count(),
            'territories' => TerritoryAnalysis::query()->forCompany($companyId)->count(),
            'service_territories' => ServiceTerritory::query()->forCompany($companyId)->where('status','active')->count(),
            'territory_evaluations' => TerritoryEvaluation::query()->forCompany($companyId)->count(),
            'pricing_signals' => GeographicPricingSignal::query()->forCompany($companyId)->count(),
            'providers' => MapProviderConnection::query()->forCompany($companyId)->where('enabled', true)->count(),
            'workers_on_duty' => $this->workerOnDutyCount($companyId),
            'checkins' => $this->checkInCount($companyId),
            'geofences' => MapGeofence::query()->forCompany($companyId)->where('enabled', true)->count(),
            'routes' => RouteSnapshot::query()->forCompany($companyId)->count(),
            'matrices' => TravelMatrixSnapshot::query()->forCompany($companyId)->count(),
            'route_plans' => RoutePlan::query()->forCompany($companyId)->count(),
            'dispatch_recommendations' => DispatchRecommendation::query()->forCompany($companyId)->count(),
            'usage_records' => MapsUsageRecord::query()->forCompany($companyId)->count(),
        ];

        $rows = match (true) {
            $page === 'field.locations' => MapLocation::query()->forCompany($companyId)->where('reference_type', '!=', 'worker')->latest('updated_at')->limit(100)->get(),
            $page === 'field.team' => $this->workerRows($companyId),
            $page === 'field.checkins' => $this->checkInRows($companyId),
            $page === 'field.dispatch' => DispatchRecommendation::query()->forCompany($companyId)->with(['candidates','decisions'])->latest('calculated_at')->limit(30)->get(),
            $page === 'field.geofences' => MapGeofence::query()->forCompany($companyId)->latest('updated_at')->limit(100)->get(),
            in_array($page, ['territories.service-areas','territories.travel-zones'], true) => ServiceTerritory::query()->forCompany($companyId)->orderByDesc('priority')->latest('updated_at')->limit(100)->get(),
            $page === 'territories.geographic-pricing' => TerritoryEvaluation::query()->forCompany($companyId)->with('signals')->latest('evaluated_at')->limit(50)->get(),
            self::analyticsTypeForPage($page) !== null => TerritoryAnalysis::query()->forCompany($companyId)->where('analysis_type', self::analyticsTypeForPage($page))->latest('generated_at')->limit($this->configuration->territoryAnalyticsHistoryLimit())->get(),
            $page === 'territories.analysis' => TerritoryAnalysis::query()->forCompany($companyId)->latest('generated_at')->limit($this->configuration->territoryAnalyticsHistoryLimit())->get(),
            $page === 'settings.providers' => MapProviderConnection::query()->forCompany($companyId)->orderBy('priority')->get(),
            $page === 'settings.routing' => $this->routingProviderRows($companyId),
            $page === 'settings.tracking' => $this->trackingStateRows($companyId),
            $page === 'settings.usage' => MapsUsageRecord::query()->forCompany($companyId)->latest('recorded_at')->limit(100)->get(),
            in_array($page, ['location.candidates','location.suppliers','location.contractors','location.competitors'], true) => $this->candidateRows($companyId, $page),
            $page === 'location.discovery' || $page === 'location.nearby' => DiscoverySearch::query()->forCompany($companyId)->latest('created_at')->limit(50)->get(),
            $page === 'travel.planner' => RoutePlan::query()->forCompany($companyId)->with('currentRun')->latest('updated_at')->limit($this->configuration->routePlanHistoryLimit())->get(),
            default => collect(),
        };

        $recordTable = $this->tableDefinition($page, $rows);
        $mapUi = $this->configuration->mapUi();
        $mapPayload = (bool) ($mapUi['enabled'] ?? false) ? $this->mapViews->forPage($companyId, $page) : null;
        if ($mapPayload !== null && $page === 'field.dispatch') {
            $mapPayload = ['markers'=>[], 'polylines'=>[], 'polygons'=>[], 'circles'=>[]];
        }
        if ($mapPayload !== null && $page === 'field.team') {
            $mapPayload['live'] = [
                'endpoint' => route('dashboard.user.titan-maps-intelligence.field.team.data'),
                'interval_ms' => $this->configuration->teamMapRefreshSeconds() * 1000,
            ];
        }

        return view('titan-maps-intelligence::user.navigation', [
            'page' => $page,
            'title' => $definition['title'],
            'description' => $definition['description'],
            'workspace' => $workspace,
            'workspaceFacts' => $this->workspaceFacts($page),
            'metricLabels' => self::metricLabels(),
            'recordTable' => $recordTable,
            'counts' => $counts,
            'rows' => $rows,
            'showSearch' => in_array($page, ['location.discovery','location.nearby'], true),
            'searchProfile' => self::searchProfile($page),
            'statusNote' => $definition['status_note'] ?? null,
            'mapPayload' => $mapPayload,
            'mapUi' => $mapUi,
            'geofenceEvents' => $page === 'field.geofences' ? MapGeofenceEvent::query()->forCompany($companyId)->latest('occurred_at')->limit(50)->get() : collect(),
            'routeHistory' => in_array($page, ['travel.index','travel.route','travel.traffic'], true) ? RouteSnapshot::query()->forCompany($companyId)->with('eta')->latest('created_at')->limit($this->configuration->routeHistoryLimit())->get() : collect(),
            'matrixHistory' => $page === 'travel.matrix' ? TravelMatrixSnapshot::query()->forCompany($companyId)->latest('created_at')->limit($this->configuration->matrixHistoryLimit())->get() : collect(),
            'nearestResourceLimit' => $this->configuration->nearestResourceLimit(),
            'routePlanMaximumStops' => $this->configuration->routePlanMaximumStops(),
            'routePlanDefaultServiceDurationSeconds' => $this->configuration->routePlanDefaultServiceDurationSeconds(),
            'dispatchCandidateLimit' => $this->configuration->dispatchCandidateLimit(),
            'serviceTerritories' => str_starts_with($page, 'territories.') ? ServiceTerritory::query()->forCompany($companyId)->orderByDesc('priority')->get() : collect(),
            'branchLocations' => in_array($page, ['territories.travel-zones','territories.geographic-pricing'], true) ? MapLocation::query()->forCompany($companyId)->where('reference_type','branch')->whereNotNull('latitude')->whereNotNull('longitude')->orderBy('public_reference_id')->get() : collect(),
            'territoryEvaluations' => $page === 'territories.geographic-pricing' ? TerritoryEvaluation::query()->forCompany($companyId)->with('signals')->latest('evaluated_at')->limit(30)->get() : collect(),
            'geographicPricingSignals' => $page === 'territories.geographic-pricing' ? GeographicPricingSignal::query()->forCompany($companyId)->latest('emitted_at')->limit(100)->get() : collect(),
            'territoryAnalyticsType' => self::analyticsTypeForPage($page),
            'territoryAnalyticsSearches' => self::analyticsTypeForPage($page) !== null ? DiscoverySearch::query()->forCompany($companyId)->latest('created_at')->limit(50)->get() : collect(),
            'territoryAnalyticsLatest' => self::analyticsTypeForPage($page) !== null ? TerritoryAnalysis::query()->forCompany($companyId)->with('cells')->where('analysis_type', self::analyticsTypeForPage($page))->latest('generated_at')->first() : null,
        ]);
    }

    private function workerOnDutyCount(string $companyId): int
    {
        $query = MapWorkerTrackingState::query()->forCompany($companyId)->where('on_duty', true)->where('tracking_allowed', true);
        if (! $this->workerVisibility->canReadCompanyWide($companyId)) {
            $query->where('user_id', $this->context->userId());
        }
        return $query->count();
    }

    private function trackingStateRows(string $companyId): mixed
    {
        $query = MapWorkerTrackingState::query()->forCompany($companyId)->latest('status_changed_at');
        if (! $this->workerVisibility->canReadCompanyWide($companyId)) {
            $query->where('user_id', $this->context->userId());
        }
        return $query->limit(100)->get();
    }

    private function routingProviderRows(string $companyId): mixed
    {
        $defaultRouting = $this->configuration->defaultRoutingProvider();
        $defaultTraffic = $this->configuration->defaultTrafficProvider();

        return MapProviderConnection::query()->forCompany($companyId)->orderBy('priority')->get()
            ->filter(static function (MapProviderConnection $connection) use ($defaultRouting, $defaultTraffic): bool {
                $capabilities = strtolower((string) json_encode((array) $connection->capabilities));
                return in_array($connection->provider, [$defaultRouting, $defaultTraffic], true)
                    || str_contains(strtolower((string) $connection->provider), 'route')
                    || str_contains($capabilities, 'route')
                    || str_contains($capabilities, 'matrix')
                    || str_contains($capabilities, 'traffic');
            })->values();
    }

    private function workerRows(string $companyId): mixed
    {
        $states = MapWorkerTrackingState::query()->forCompany($companyId)->where('on_duty', true)->where('tracking_allowed', true);
        if (! $this->workerVisibility->canReadCompanyWide($companyId)) {
            $states->where('user_id', $this->context->userId());
        }
        $workerIds = $states->pluck('worker_public_id');
        return MapLocation::query()->forCompany($companyId)
            ->where('reference_type', 'worker')->where('source', 'gps')
            ->whereIn('public_reference_id', $workerIds)
            ->where('coordinates_verified_at', '>=', now()->subSeconds($this->configuration->workerLocationStaleAfterSeconds()))
            ->latest('coordinates_verified_at')->limit(100)->get();
    }

    private function checkInCount(string $companyId): int
    {
        $query = MapLocationPing::query()->forCompany($companyId);
        if (! $this->workerVisibility->canReadCompanyWide($companyId)) {
            $query->where('user_id', $this->context->userId());
        } else {
            $sharedWorkers = MapWorkerTrackingState::query()->forCompany($companyId)
                ->where('tracking_allowed', true)
                ->whereNotNull('share_history_until')
                ->where('share_history_until', '>=', now())
                ->pluck('worker_public_id')->filter()->values();
            $query->whereIn('worker_public_id', $sharedWorkers);
        }
        return $query->count();
    }

    private function checkInRows(string $companyId): mixed
    {
        $query = MapLocationPing::query()->forCompany($companyId)->latest('captured_at');
        if (! $this->workerVisibility->canReadCompanyWide($companyId)) {
            $query->where('user_id', $this->context->userId());
        } else {
            $sharedWorkers = MapWorkerTrackingState::query()->forCompany($companyId)
                ->where('tracking_allowed', true)
                ->whereNotNull('share_history_until')
                ->where('share_history_until', '>=', now())
                ->pluck('worker_public_id')->filter()->values();
            $query->whereIn('worker_public_id', $sharedWorkers);
        }
        return $query->limit(100)->get();
    }

    private function candidateRows(string $companyId, string $page): mixed
    {
        $query = DiscoveryCandidate::query()->forCompany($companyId)->with('place')->latest('created_at');
        $types = match ($page) {
            'location.suppliers' => ['supplier_candidate'],
            'location.contractors' => ['contractor_candidate','provider_candidate','emergency_provider'],
            'location.competitors' => ['competitor'],
            default => [],
        };
        if ($types !== []) {
            $query->whereIn('candidate_type', $types);
        }
        return $query->limit(50)->get();
    }

    /** @return array<string,mixed>|null */
    private function tableDefinition(string $page, mixed $rows): ?array
    {
        return match ($page) {
            'field.locations' => $this->locationTable($rows),
            'field.team' => $this->teamTable($rows),
            'field.dispatch' => $this->dispatchTable($rows),
            'field.geofences' => $this->geofenceTable($rows),
            'field.checkins' => $this->checkInTable($rows),
            'location.discovery' => $this->searchTable($rows, 'Recent business discovery searches'),
            'location.nearby' => $this->searchTable($rows, 'Recent nearby-service searches'),
            'location.candidates' => $this->candidateTable($rows, 'All discovery candidates'),
            'location.suppliers' => $this->candidateTable($rows, 'Supplier candidates'),
            'location.contractors' => $this->candidateTable($rows, 'Contractor and provider candidates'),
            'location.competitors' => $this->candidateTable($rows, 'Observed competitor candidates'),
            'territories.analysis' => $this->analysisTable($rows, 'Territory analysis history'),
            'territories.providers' => $this->analysisTable($rows, 'Provider coverage analysis history'),
            'territories.competitors' => $this->analysisTable($rows, 'Competitor density analysis history'),
            'territories.suppliers' => $this->analysisTable($rows, 'Supplier coverage analysis history'),
            'territories.gaps' => $this->analysisTable($rows, 'Service gap analysis history'),
            'territories.branch-coverage' => $this->analysisTable($rows, 'Branch coverage analysis history'),
            'territories.expansion-opportunities' => $this->analysisTable($rows, 'Expansion opportunity analysis history'),
            'travel.planner' => $this->routePlanTable($rows),
            'settings.providers' => $this->providerTable($rows),
            'settings.routing' => $this->routingProviderTable($rows),
            'settings.tracking' => $this->trackingTable($rows),
            'settings.usage' => $this->usageTable($rows),
            default => null,
        };
    }

    /** @return array<string,mixed> */
    private function locationTable(mixed $rows): array
    {
        return $this->table(
            'Canonical locations',
            ['Type','Reference','Address','Source','Precision','Verified'],
            $rows->map(static fn (MapLocation $row): array => [
                self::human($row->reference_type),
                (string) $row->public_reference_id,
                $row->formatted_address ?: 'Coordinates only',
                self::human($row->source),
                $row->precision ?: '—',
                self::date($row->coordinates_verified_at ?? $row->updated_at),
            ])->values()->all(),
            'No canonical company locations have been recorded yet.'
        );
    }

    /** @return array<string,mixed> */
    private function teamTable(mixed $rows): array
    {
        return $this->table(
            'On-duty team positions',
            ['Worker','Coordinates','Position source','Precision','Last accepted'],
            $rows->map(static fn (MapLocation $row): array => [
                (string) $row->public_reference_id,
                number_format((float) $row->latitude, 5).', '.number_format((float) $row->longitude, 5),
                self::human($row->source),
                $row->precision ?: '—',
                self::date($row->coordinates_verified_at),
            ])->values()->all(),
            'No on-duty workers currently have an accepted shareable GPS position.'
        );
    }

    /** @return array<string,mixed> */
    private function checkInTable(mixed $rows): array
    {
        return $this->table(
            'Accepted worker location samples',
            ['Worker','Captured','Received','Accuracy','Coordinates','Speed'],
            $rows->map(static fn (MapLocationPing $row): array => [
                (string) $row->worker_public_id,
                self::date($row->captured_at),
                self::date($row->received_at),
                number_format((float) $row->accuracy_metres, 1).' m',
                number_format((float) $row->latitude, 5).', '.number_format((float) $row->longitude, 5),
                $row->speed_metres_per_second !== null ? number_format((float) $row->speed_metres_per_second, 1).' m/s' : '—',
            ])->values()->all(),
            'No retained accepted worker location samples are available for this view.'
        );
    }

    /** @return array<string,mixed> */
    private function dispatchTable(mixed $rows): array
    {
        return $this->table(
            'Dispatch recommendation history',
            ['Job','Recommended worker','Selected worker','Status','Calculated','Expires'],
            $rows->map(static fn (DispatchRecommendation $row): array => [
                $row->job_title ?: (string) $row->job_public_id,
                $row->recommended_worker_public_id ?: 'No recommendation',
                $row->selected_worker_public_id ?: 'Not selected',
                self::human($row->status),
                self::date($row->calculated_at),
                self::date($row->expires_at),
            ])->values()->all(),
            'No dispatch recommendations have been calculated yet.'
        );
    }

    /** @return array<string,mixed> */
    private function geofenceTable(mixed $rows): array
    {
        return $this->table(
            'Configured geofences',
            ['Name','Shape','Reference','Dwell','Confirmation','Updated'],
            $rows->map(static fn (MapGeofence $row): array => [
                (string) $row->name,
                self::human($row->shape_type),
                $row->reference_type ? self::human($row->reference_type).' '.($row->public_reference_id ?: '') : 'General',
                max(0, (int) $row->dwell_seconds).' sec',
                ($row->arrival_confirmation_required || $row->departure_confirmation_required) ? 'Required' : 'Automatic',
                self::date($row->updated_at),
            ])->values()->all(),
            'No geofences have been configured yet.'
        );
    }

    /** @return array<string,mixed> */
    private function searchTable(mixed $rows, string $title): array
    {
        return $this->table(
            $title,
            ['Query','Purpose','Category','Radius','Status','Started','Completed'],
            $rows->map(static fn (DiscoverySearch $row): array => [
                $row->query ?: 'Untitled search',
                self::human($row->purpose),
                $row->category ?: 'Any',
                $row->radius_metres !== null ? number_format((float) $row->radius_metres / 1000, 1).' km' : 'Not fixed',
                self::human($row->status),
                self::date($row->started_at ?? $row->created_at),
                self::date($row->completed_at),
            ])->values()->all(),
            'No searches have been run from this workspace yet.'
        );
    }

    /** @return array<string,mixed> */
    private function candidateTable(mixed $rows, string $title): array
    {
        return $this->table(
            $title,
            ['Business / provider','Type','Relevance','Confidence','Review','Lifecycle','Match state'],
            $rows->map(static fn (DiscoveryCandidate $row): array => [
                $row->place?->name ?: (string) $row->id,
                self::human($row->candidate_type),
                number_format(((float) $row->relevance_score) * 100, 0).'%',
                number_format(((float) $row->confidence_score) * 100, 0).'%',
                self::human($row->review_status),
                self::human($row->lifecycle_status),
                $row->unresolved_match ? 'Unresolved' : ($row->existing_workcore_entity_id ? 'Matched' : 'New'),
            ])->values()->all(),
            'No candidates exist in this category yet.'
        );
    }

    /** @return array<string,mixed> */
    private function analysisTable(mixed $rows, string $title): array
    {
        return $this->table(
            $title,
            ['Analysis','Methodology','Area','Confidence','Generated'],
            $rows->map(static fn (TerritoryAnalysis $row): array => [
                self::human($row->analysis_type),
                ($row->methodology_key ?: '—').' v'.($row->methodology_version ?: '—'),
                number_format((float) $row->area_square_km, 2).' km²',
                number_format(((float) $row->confidence) * 100, 0).'%',
                self::date($row->generated_at),
            ])->values()->all(),
            'No completed analyses are available for this methodology yet.'
        );
    }

    /** @return array<string,mixed> */
    private function routePlanTable(mixed $rows): array
    {
        return $this->table(
            'Route plan history',
            ['Plan','Service date','Worker','Travel mode','Status','Start','Revision'],
            $rows->map(static fn (RoutePlan $row): array => [
                $row->name ?: (string) $row->id,
                $row->service_date?->format('Y-m-d') ?? '—',
                $row->worker_public_id ?: 'Unassigned',
                self::human($row->travel_mode),
                self::human($row->status),
                self::date($row->start_at),
                $row->currentRun?->revision !== null ? '#'.(int) $row->currentRun->revision : '—',
            ])->values()->all(),
            'No route plans have been created yet.'
        );
    }

    /** @return array<string,mixed> */
    private function providerTable(mixed $rows): array
    {
        return $this->table(
            'Map and place-data provider connections',
            ['Provider','Enabled','Health','Priority','Capabilities','Validated'],
            $rows->map(static fn (MapProviderConnection $row): array => [
                (string) $row->provider,
                $row->enabled ? 'Yes' : 'No',
                self::human($row->health_status ?: 'unknown'),
                (string) $row->priority,
                self::listText((array) $row->capabilities),
                self::date($row->last_validated_at),
            ])->values()->all(),
            'No company-scoped map provider connections are configured.'
        );
    }

    /** @return array<string,mixed> */
    private function routingProviderTable(mixed $rows): array
    {
        $defaultRouting = $this->configuration->defaultRoutingProvider();
        $defaultTraffic = $this->configuration->defaultTrafficProvider();
        return $this->table(
            'Routing and traffic provider connections',
            ['Provider','Role','Enabled','Health','Last error','Validated'],
            $rows->map(static function (MapProviderConnection $row) use ($defaultRouting, $defaultTraffic): array {
                $roles = [];
                if ($row->provider === $defaultRouting) $roles[] = 'Default routing';
                if ($row->provider === $defaultTraffic) $roles[] = 'Default traffic';
                if ($roles === []) $roles[] = 'Routing capable';
                return [
                    (string) $row->provider,
                    implode(' + ', $roles),
                    $row->enabled ? 'Yes' : 'No',
                    self::human($row->health_status ?: 'unknown'),
                    $row->last_error_code ?: 'None',
                    self::date($row->last_validated_at),
                ];
            })->values()->all(),
            'No routing or traffic provider connection is configured for this company.'
        );
    }

    /** @return array<string,mixed> */
    private function trackingTable(mixed $rows): array
    {
        return $this->table(
            'Worker tracking consent and duty state',
            ['Worker','On duty','Tracking allowed','Latest capture','Last received','History shared until'],
            $rows->map(static fn (MapWorkerTrackingState $row): array => [
                (string) $row->worker_public_id,
                $row->on_duty ? 'Yes' : 'No',
                $row->tracking_allowed ? 'Yes' : 'No',
                self::date($row->latest_captured_at),
                self::date($row->last_received_at),
                self::date($row->share_history_until),
            ])->values()->all(),
            'No worker tracking state has been recorded yet.'
        );
    }

    /** @return array<string,mixed> */
    private function usageTable(mixed $rows): array
    {
        return $this->table(
            'Recent provider usage',
            ['Provider','Operation','Requests','Results','Billable units','Estimated cost','Recorded'],
            $rows->map(static fn (MapsUsageRecord $row): array => [
                (string) $row->provider,
                self::human($row->operation),
                number_format((int) $row->request_count),
                number_format((int) $row->result_count),
                number_format((float) $row->billable_units, 2),
                $row->estimated_cost !== null ? ($row->currency ?: '').' '.number_format((float) $row->estimated_cost, 4) : 'Not estimated',
                self::date($row->recorded_at),
            ])->values()->all(),
            'No provider usage has been recorded for this company yet.'
        );
    }

    /** @param array<int,string> $columns @param array<int,array<int,string>> $rows @return array<string,mixed> */
    private function table(string $title, array $columns, array $rows, string $emptyMessage): array
    {
        return ['title'=>$title, 'columns'=>$columns, 'rows'=>$rows, 'empty_message'=>$emptyMessage];
    }

    /** @return array<int,array{label:string,value:string,hint?:string}> */
    private function workspaceFacts(string $page): array
    {
        return match ($page) {
            'field.index' => [
                ['label'=>'Map UI','value'=>(bool)($this->configuration->mapUi()['enabled'] ?? false) ? 'Enabled' : 'Disabled'],
                ['label'=>'Team refresh','value'=>$this->configuration->teamMapRefreshSeconds().' sec'],
                ['label'=>'Worker stale after','value'=>max(1, (int) round($this->configuration->workerLocationStaleAfterSeconds()/60)).' min'],
            ],
            'field.team' => [
                ['label'=>'Live refresh','value'=>$this->configuration->teamMapRefreshSeconds().' sec'],
                ['label'=>'Location stale after','value'=>max(1, (int) round($this->configuration->workerLocationStaleAfterSeconds()/60)).' min'],
            ],
            'field.checkins' => [
                ['label'=>'Retention','value'=>$this->configuration->locationRetentionDays().' days'],
                ['label'=>'Minimum ping','value'=>$this->configuration->minimumPingIntervalSeconds().' sec'],
            ],
            'location.index' => [
                ['label'=>'Default place provider','value'=>$this->configuration->defaultProvider()],
                ['label'=>'Maximum results','value'=>(string)$this->configuration->maximumResults()],
                ['label'=>'Maximum radius','value'=>number_format($this->configuration->maximumRadiusMetres()/1000, 0).' km'],
            ],
            'territories.index' => [
                ['label'=>'Analytics cell size','value'=>number_format($this->configuration->territoryAnalyticsCellSizeKm(), 1).' km'],
                ['label'=>'Maximum cells','value'=>(string)$this->configuration->territoryAnalyticsMaximumCells()],
                ['label'=>'Snapshot TTL','value'=>max(1, (int) round($this->configuration->territoryAnalyticsSnapshotTtlSeconds()/3600)).' hr'],
            ],
            'travel.index' => [
                ['label'=>'Default router','value'=>$this->configuration->defaultRoutingProvider()],
                ['label'=>'Route history','value'=>(string)$this->configuration->routeHistoryLimit()],
                ['label'=>'Planner max stops','value'=>(string)$this->configuration->routePlanMaximumStops()],
                ['label'=>'Matrix max elements','value'=>(string)$this->configuration->maximumRouteMatrixElements()],
            ],
            'settings.index' => [
                ['label'=>'Configuration','value'=>$this->configuration->version()],
                ['label'=>'Place provider','value'=>$this->configuration->defaultProvider()],
                ['label'=>'Routing provider','value'=>$this->configuration->defaultRoutingProvider()],
                ['label'=>'Tracking','value'=>$this->configuration->workerTrackingEnabled() ? 'Enabled' : 'Disabled'],
            ],
            'settings.providers' => [
                ['label'=>'Place provider','value'=>$this->configuration->defaultProvider()],
                ['label'=>'Geocoder','value'=>$this->configuration->defaultGeocodingProvider()],
                ['label'=>'Daily request limit','value'=>number_format($this->configuration->providerQuotaDailyRequestLimit())],
                ['label'=>'Monthly request limit','value'=>number_format($this->configuration->providerQuotaMonthlyRequestLimit())],
            ],
            'settings.routing' => [
                ['label'=>'Default router','value'=>$this->configuration->defaultRoutingProvider()],
                ['label'=>'Traffic provider','value'=>$this->configuration->defaultTrafficProvider()],
                ['label'=>'Traffic-aware TTL','value'=>$this->configuration->trafficAwareRouteTtlSeconds().' sec'],
                ['label'=>'Last-valid max age','value'=>$this->configuration->lastValidRouteMaxAgeHours().' hr'],
                ['label'=>'Matrix elements','value'=>(string)$this->configuration->maximumRouteMatrixElements()],
            ],
            'settings.tracking' => [
                ['label'=>'Tracking','value'=>$this->configuration->workerTrackingEnabled() ? 'Enabled' : 'Disabled'],
                ['label'=>'Minimum ping','value'=>$this->configuration->minimumPingIntervalSeconds().' sec'],
                ['label'=>'Minimum movement','value'=>number_format($this->configuration->minimumMovementMetres(), 1).' m'],
                ['label'=>'Maximum accuracy','value'=>number_format($this->configuration->maximumLocationAccuracyMetres(), 0).' m'],
                ['label'=>'Stale after','value'=>max(1, (int) round($this->configuration->workerLocationStaleAfterSeconds()/60)).' min'],
            ],
            'settings.privacy' => [
                ['label'=>'Retention policy','value'=>self::human($this->configuration->workerRetentionPolicy())],
                ['label'=>'GPS history retention','value'=>$this->configuration->locationRetentionDays().' days'],
                ['label'=>'Maximum capture age','value'=>$this->configuration->maximumCaptureAgeSeconds().' sec'],
                ['label'=>'Future timestamp skew','value'=>$this->configuration->maximumFutureSkewSeconds().' sec'],
                ['label'=>'Geofence hysteresis','value'=>number_format($this->configuration->geofenceHysteresisMetres(), 1).' m'],
            ],
            'settings.usage' => [
                ['label'=>'Daily request limit','value'=>number_format($this->configuration->providerQuotaDailyRequestLimit())],
                ['label'=>'Monthly request limit','value'=>number_format($this->configuration->providerQuotaMonthlyRequestLimit())],
                ['label'=>'Soft limit','value'=>$this->configuration->providerQuotaSoftLimitPercent().'%'],
            ],
            default => [],
        };
    }

    /** @return array<string,string> */
    private static function metricLabels(): array
    {
        return [
            'searches'=>'Searches', 'candidates'=>'Candidates', 'supplier_candidates'=>'Supplier Candidates',
            'contractor_candidates'=>'Contractor Candidates', 'competitor_candidates'=>'Competitors', 'locations'=>'Locations',
            'branches'=>'Branches', 'workers_on_duty'=>'On-duty Workers', 'checkins'=>'Accepted Check-ins', 'geofences'=>'Geofences',
            'territories'=>'Analyses', 'service_territories'=>'Service Areas', 'territory_evaluations'=>'Coverage Evaluations',
            'pricing_signals'=>'Pricing Signals', 'routes'=>'Routes', 'matrices'=>'Matrices', 'route_plans'=>'Route Plans',
            'dispatch_recommendations'=>'Dispatch Recommendations', 'providers'=>'Active Providers', 'usage_records'=>'Usage Records',
        ];
    }

    /** @return array<string,mixed> */
    private static function workspaceDefinition(string $page): array
    {
        return match ($page) {
            'field.index' => ['metric_keys'=>['locations','workers_on_duty','geofences','routes','dispatch_recommendations','providers'],'links'=>[
                ['label'=>'Locations','route'=>'dashboard.user.titan-maps-intelligence.field.locations'],['label'=>'Team Map','route'=>'dashboard.user.titan-maps-intelligence.field.team'],['label'=>'Dispatch Intelligence','route'=>'dashboard.user.titan-maps-intelligence.field.dispatch'],['label'=>'Geofences','route'=>'dashboard.user.titan-maps-intelligence.field.geofences'],['label'=>'Check-ins','route'=>'dashboard.user.titan-maps-intelligence.field.checkins'],
            ]],
            'field.locations' => ['metric_keys'=>['locations','branches','workers_on_duty','geofences']],
            'field.team' => ['metric_keys'=>['workers_on_duty','checkins','locations','geofences']],
            'field.dispatch' => ['metric_keys'=>['dispatch_recommendations','workers_on_duty','routes','matrices']],
            'field.geofences' => ['metric_keys'=>['geofences','workers_on_duty','checkins','locations']],
            'field.checkins' => ['metric_keys'=>['checkins','workers_on_duty','geofences','locations']],

            'location.index' => ['metric_keys'=>['searches','candidates','supplier_candidates','contractor_candidates','competitor_candidates','providers'],'links'=>[
                ['label'=>'Business Discovery','route'=>'dashboard.user.titan-maps-intelligence.location.discovery'],['label'=>'Candidates','route'=>'dashboard.user.titan-maps-intelligence.location.candidates'],['label'=>'Suppliers','route'=>'dashboard.user.titan-maps-intelligence.location.suppliers'],['label'=>'Contractors','route'=>'dashboard.user.titan-maps-intelligence.location.contractors'],['label'=>'Competitors','route'=>'dashboard.user.titan-maps-intelligence.location.competitors'],['label'=>'Nearby Services','route'=>'dashboard.user.titan-maps-intelligence.location.nearby'],
            ]],
            'location.discovery' => ['metric_keys'=>['searches','candidates','providers']],
            'location.candidates' => ['metric_keys'=>['candidates','searches','providers']],
            'location.suppliers' => ['metric_keys'=>['supplier_candidates','searches','providers']],
            'location.contractors' => ['metric_keys'=>['contractor_candidates','searches','providers']],
            'location.competitors' => ['metric_keys'=>['competitor_candidates','searches','territories']],
            'location.nearby' => ['metric_keys'=>['searches','candidates','locations','providers']],

            'territories.index' => ['metric_keys'=>['service_territories','territories','territory_evaluations','pricing_signals','branches'],'links'=>[
                ['label'=>'Service Areas','route'=>'dashboard.user.titan-maps-intelligence.territories.service-areas'],['label'=>'Travel Zones','route'=>'dashboard.user.titan-maps-intelligence.territories.travel-zones'],['label'=>'Geographic Pricing','route'=>'dashboard.user.titan-maps-intelligence.territories.geographic-pricing'],['label'=>'Territory Analysis','route'=>'dashboard.user.titan-maps-intelligence.territories.analysis'],['label'=>'Provider Coverage','route'=>'dashboard.user.titan-maps-intelligence.territories.providers'],['label'=>'Expansion Opportunities','route'=>'dashboard.user.titan-maps-intelligence.territories.expansion-opportunities'],
            ]],
            'territories.service-areas' => ['metric_keys'=>['service_territories','territory_evaluations','branches']],
            'territories.travel-zones' => ['metric_keys'=>['service_territories','territory_evaluations','branches','routes']],
            'territories.geographic-pricing' => ['metric_keys'=>['territory_evaluations','pricing_signals','service_territories','routes']],
            'territories.analysis' => ['metric_keys'=>['territories','service_territories','territory_evaluations']],
            'territories.providers' => ['metric_keys'=>['territories','candidates','service_territories']],
            'territories.competitors' => ['metric_keys'=>['territories','competitor_candidates','searches']],
            'territories.suppliers' => ['metric_keys'=>['territories','supplier_candidates','branches']],
            'territories.gaps' => ['metric_keys'=>['territories','service_territories','locations']],
            'territories.branch-coverage' => ['metric_keys'=>['territories','branches','service_territories']],
            'territories.expansion-opportunities' => ['metric_keys'=>['territories','candidates','branches']],

            'travel.index' => ['metric_keys'=>['routes','matrices','route_plans','branches','providers'],'links'=>[
                ['label'=>'Route Calculator','route'=>'dashboard.user.titan-maps-intelligence.travel.route'],['label'=>'Travel Matrix','route'=>'dashboard.user.titan-maps-intelligence.travel.matrix'],['label'=>'Route Planner','route'=>'dashboard.user.titan-maps-intelligence.travel.planner'],['label'=>'Traffic and ETA','route'=>'dashboard.user.titan-maps-intelligence.travel.traffic'],
            ]],
            'travel.route' => ['metric_keys'=>['routes','providers']],
            'travel.matrix' => ['metric_keys'=>['matrices','routes','workers_on_duty']],
            'travel.planner' => ['metric_keys'=>['route_plans','routes','matrices']],
            'travel.traffic' => ['metric_keys'=>['routes','providers']],

            'settings.index' => ['metric_keys'=>['providers','usage_records','workers_on_duty','geofences'],'links'=>[
                ['label'=>'Providers','route'=>'dashboard.user.titan-maps-intelligence.settings.providers'],['label'=>'Routing','route'=>'dashboard.user.titan-maps-intelligence.settings.routing'],['label'=>'Location Tracking','route'=>'dashboard.user.titan-maps-intelligence.settings.tracking'],['label'=>'Privacy and Retention','route'=>'dashboard.user.titan-maps-intelligence.settings.privacy'],['label'=>'Usage and Limits','route'=>'dashboard.user.titan-maps-intelligence.settings.usage'],
            ]],
            'settings.providers' => ['metric_keys'=>['providers','usage_records']],
            'settings.routing' => ['metric_keys'=>['providers','routes','matrices']],
            'settings.tracking' => ['metric_keys'=>['workers_on_duty','checkins','locations']],
            'settings.privacy' => ['metric_keys'=>['checkins','workers_on_duty','geofences']],
            'settings.usage' => ['metric_keys'=>['usage_records','providers']],
            default => ['metric_keys'=>[]],
        };
    }

    /** @return array<string,mixed> */
    private static function searchProfile(string $page): array
    {
        return match ($page) {
            'location.nearby' => [
                'legend'=>'Nearby services search',
                'placeholder'=>'Supplier, contractor or service near this job or property',
                'button_label'=>'Search nearby services',
                'default_purpose'=>'provider_discovery',
                'hint'=>'Use a current/job location and radius to find nearby operational resources without promoting them automatically.',
            ],
            default => [
                'legend'=>'Business discovery',
                'placeholder'=>'Emergency plumber near this property',
                'button_label'=>'Start business discovery',
                'default_purpose'=>'provider_discovery',
                'hint'=>'Results enter the governed candidate workflow before promotion into operational systems.',
            ],
        };
    }

    private static function analyticsTypeForPage(string $page): ?string
    {
        return match ($page) {
            'territories.providers' => 'provider_coverage',
            'territories.competitors' => 'competitor_density',
            'territories.suppliers' => 'supplier_coverage',
            'territories.gaps' => 'service_gap',
            'territories.branch-coverage' => 'branch_coverage',
            'territories.expansion-opportunities' => 'expansion_opportunity',
            default => null,
        };
    }

    private static function human(?string $value): string
    {
        if ($value === null || trim($value) === '') return '—';
        return str_replace('  ', ' ', ucwords(str_replace(['_','-'], ' ', $value)));
    }

    private static function date(mixed $value): string
    {
        return is_object($value) && method_exists($value, 'format') ? $value->format('Y-m-d H:i') : '—';
    }

    /** @param array<int|string,mixed> $values */
    private static function listText(array $values): string
    {
        if ($values === []) return '—';
        $flat = [];
        array_walk_recursive($values, static function (mixed $value) use (&$flat): void {
            if (is_scalar($value) && trim((string) $value) !== '') $flat[] = self::human((string) $value);
        });
        return $flat === [] ? '—' : implode(', ', array_slice(array_values(array_unique($flat)), 0, 8));
    }

    /** @return array{title:string,description:string,status_note?:string} */
    private static function pageDefinition(string $page): array
    {
        return match ($page) {
            'field.index' => ['title'=>'Live Map','description'=>'Graphical operational map for jobs, properties, branches, workers, suppliers and contractors.'],
            'field.locations' => ['title'=>'Locations','description'=>'Graphical map of canonical company locations linked to authoritative Titan business records.'],
            'field.team' => ['title'=>'Team Map','description'=>'Live graphical map of accepted on-duty worker GPS positions.'],
            'field.dispatch' => ['title'=>'Dispatch Intelligence','description'=>'Rank eligible workers for a job using travel, skills, availability, workload, territory, continuity and urgency evidence.','status_note'=>'Recommendations require human approval. Unknown qualification or certification evidence remains unknown and is never presented as verified.'],
            'field.geofences' => ['title'=>'Geofences','description'=>'Draw radius or polygon geofences on the live map and attach them to jobs, properties or other Titan references.','status_note'=>'Boundary transitions use GPS accuracy, hysteresis and consecutive samples; job/property arrival and departure actions require confirmation by default.'],
            'field.checkins' => ['title'=>'Check-ins','description'=>'Graphical worker GPS trails plus recent privacy-safe accepted location samples.'],
            'location.index' => ['title'=>'Location Intelligence','description'=>'Discover, review and govern nearby businesses, providers and market candidates.'],
            'location.discovery' => ['title'=>'Business Discovery','description'=>'Search external place intelligence and create governed discovery candidates.'],
            'location.candidates' => ['title'=>'Candidates','description'=>'Review all discovered candidates before promotion into operational systems.'],
            'location.suppliers' => ['title'=>'Suppliers','description'=>'Supplier candidates discovered around jobs, territories and service areas.'],
            'location.contractors' => ['title'=>'Contractors','description'=>'Provider and contractor candidates for overflow, specialist and emergency work.'],
            'location.competitors' => ['title'=>'Competitors','description'=>'Observed competitor candidates for territory and market analysis.'],
            'location.nearby' => ['title'=>'Nearby Services','description'=>'Run discovery focused on services near a job, property or operating area.'],
            'territories.index' => ['title'=>'Territories and Coverage','description'=>'Geographic coverage intelligence from observed provider data and governed service-area definitions.'],
            'territories.service-areas' => ['title'=>'Service Areas','description'=>'Create graphical circle/polygon service areas or exact suburb/postcode coverage rules.','status_note'=>'Green areas include service coverage; red areas are exclusions. Postcode/suburb rules are exact text rules and are not rendered as fake polygons.'],
            'territories.travel-zones' => ['title'=>'Travel Zones','description'=>'Define branch-based maximum road-distance or drive-time coverage bands.','status_note'=>'Travel-zone membership requires provider-derived or retained route evidence. Straight-line fallback never qualifies a road-distance or drive-time zone.'],
            'territories.geographic-pricing' => ['title'=>'Geographic Pricing Signals','description'=>'Evaluate a target location and emit neutral geographic signals for CRM/quoting.','status_note'=>'Maps never applies a surcharge or changes a quote. Any fixed/percentage value is an advisory hint with authoritative=false and application_status=not_applied.'],
            'territories.analysis' => ['title'=>'Territory Analysis','description'=>'Review generated territory analyses and their evidence.'],
            'territories.providers' => ['title'=>'Provider Coverage','description'=>'Measure covered-cell ratio and provider density per square kilometre using observed provider and internal contractor evidence.','status_note'=>'Coverage is cell-based. A cell is covered only when observed external or canonical internal provider evidence exists.'],
            'territories.competitors' => ['title'=>'Competitor Density','description'=>'Measure observed competitors against an explicit square-kilometre denominator, including per-cell density.','status_note'=>'Density is competitors ÷ km²; Titan does not infer unobserved competitors.'],
            'territories.suppliers' => ['title'=>'Supplier Coverage','description'=>'Measure supplier access using provider-derived or retained travel-time bands for each analysis cell.','status_note'=>'Cells without a real/stale ETA remain in the Unavailable band; straight-line distance never becomes a supplier ETA.'],
            'territories.gaps' => ['title'=>'Service Gaps','description'=>'Combine observed job concentration with internal/provider coverage to identify operational service gaps.','status_note'=>'If canonical job-location evidence is absent, demand is explicitly unavailable and is not invented from market data.'],
            'territories.branch-coverage' => ['title'=>'Branch Coverage','description'=>'Measure which geographic cells are nearest to each canonical branch and identify unassigned/remote cells.','status_note'=>'Branch proximity is labelled with its evidence basis; current fallback is explicit straight-line proximity when no road evidence is available.'],
            'territories.expansion-opportunities' => ['title'=>'Expansion Opportunities','description'=>'Rank geographic cells using configurable demand, coverage-gap, competitor, supplier-access and branch-distance evidence.','status_note'=>'Missing evidence reduces evidence completeness instead of being treated as favourable. The score is geographic intelligence, not an investment decision.'],
            'travel.index' => ['title'=>'Travel and Routing','description'=>'Graphical routing workspace with durable road-route and ETA provenance.','status_note'=>'Provider routes are persisted with freshness. Provider failure falls back to a clearly marked stale snapshot or straight-line distance estimate; Titan never fabricates live ETA.'],
            'travel.route' => ['title'=>'Route Calculator','description'=>'Calculate road distance and traffic-aware ETA with durable provenance and explicit fallback labels.','status_note'=>'Road distance is provider-derived. If routing is unavailable, Titan uses a stale matching provider snapshot when available; otherwise only straight-line distance is shown and ETA is unavailable.'],
            'travel.matrix' => ['title'=>'Travel Matrix','description'=>'Compare road distance and traffic-aware ETA across workers, suppliers and contractors on one graphical map.','status_note'=>'Fresh identical matrices are reused to protect provider quota. Provider failure uses a clearly labelled stale matrix when available, otherwise straight-line estimates with ETA unavailable.'],
            'travel.planner' => ['title'=>'Route Planner','description'=>'Build and optimise a multi-stop field route with depots, jobs, suppliers, contractors and breaks.','status_note'=>'Optimisation uses a deterministic matrix-backed heuristic. Locked stops never move; appointment-window conflicts are reported instead of hidden. Dashed sequence connectors are not road geometry unless road geometry is explicitly requested.'],
            'travel.traffic' => ['title'=>'Traffic and ETA','description'=>'Review provider-derived ETA, static duration, traffic delay and route freshness history.','status_note'=>'Stale snapshots are explicitly marked stale and are never presented as current traffic.'],
            'settings.index' => ['title'=>'Maps and Location','description'=>'Company-level map provider, tracking, privacy and usage configuration.'],
            'settings.providers' => ['title'=>'Providers','description'=>'Configured mapping and place-data connections for this company.'],
            'settings.routing' => ['title'=>'Routing','description'=>'Routing-provider connections and capability status.'],
            'settings.tracking' => ['title'=>'Location Tracking','description'=>'On-duty and worker-consent state for live Titan Go/PWA location tracking.','status_note'=>'Workers must explicitly allow tracking and be on duty before GPS samples are accepted.'],
            'settings.privacy' => ['title'=>'Privacy and Retention','description'=>'Location provenance and retention controls.','status_note'=>'GPS history retention is configurable and can be pruned with titan-maps:prune-location-pings; the latest operational position remains a separate projection.'],
            'settings.usage' => ['title'=>'Usage and Limits','description'=>'Recent maps-provider usage recorded for this company.'],
            default => ['title'=>'Titan Maps Intelligence','description'=>'Location and geographic intelligence for Titan Zero.'],
        };
    }
}

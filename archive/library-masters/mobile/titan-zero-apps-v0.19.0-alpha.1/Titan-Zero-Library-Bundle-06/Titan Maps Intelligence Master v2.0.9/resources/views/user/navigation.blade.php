@extends('panel.layout.app')

@section('content')
<link rel="stylesheet" href="{{ route('dashboard.user.titan-maps-intelligence.assets.show', ['asset' => 'titan-map-engine.css', 'v' => '2.0.0-beta.1.9']) }}">
<div class="container-fluid py-6" data-titan-maps-navigation="{{ $page }}">
    <div class="mb-5">
        <h1 class="mb-2">{{ $title }}</h1>
        <p class="text-muted mb-0">{{ $description }}</p>
    </div>

    @if ($statusNote)
        <div class="alert alert-info">{{ $statusNote }}</div>
    @endif

    <div data-titan-maps-workspace="{{ $page }}">
        @if ($workspaceFacts !== [])
            <div class="row g-3 mb-4" data-titan-maps-workspace-facts>
                @foreach ($workspaceFacts as $fact)
                    <div class="col-6 col-md-4 col-xl-3">
                        <div class="card h-100 titan-maps-workspace-fact-card">
                            <div class="card-body">
                                <div class="text-muted small">{{ $fact['label'] }}</div>
                                <div class="fw-bold mt-1">{{ $fact['value'] }}</div>
                                @if (! empty($fact['hint']))<div class="text-muted small mt-1">{{ $fact['hint'] }}</div>@endif
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
        @endif

        @if (($workspace['metric_keys'] ?? []) !== [])
            <div class="row g-3 mb-5" data-titan-maps-kpi-grid>
                @foreach ($workspace['metric_keys'] as $key)
                    @php
                        $label = $metricLabels[$key] ?? str($key)->replace('_', ' ')->title();
                    @endphp
                    <div class="col-6 col-md-4 col-lg-3 col-xxl-2">
                        <div class="card h-100 titan-maps-kpi-card">
                            <div class="card-body titan-maps-kpi-card-body">
                                <div class="titan-maps-kpi-label" data-titan-maps-kpi-label>{{ $label }}</div>
                                <div class="titan-maps-kpi-value" data-titan-maps-kpi-value>{{ number_format((int) ($counts[$key] ?? 0)) }}</div>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
        @endif

        @if (($workspace['links'] ?? []) !== [])
            <div class="card mb-5 titan-maps-workspace-links-card">
                <div class="card-header"><h3 class="card-title mb-0">Workspace</h3></div>
                <div class="card-body">
                    <div class="row g-3">
                        @foreach ($workspace['links'] as $link)
                            <div class="col-12 col-md-6 col-xl-4">
                                <a class="titan-maps-workspace-link" href="{{ route($link['route']) }}">
                                    <span>{{ $link['label'] }}</span><span aria-hidden="true">→</span>
                                </a>
                            </div>
                        @endforeach
                    </div>
                </div>
            </div>
        @endif
    </div>


    <x-titan-maps-intelligence::service-territory-manager
        :page="$page"
        :service-territories="$serviceTerritories"
        :branch-locations="$branchLocations"
        :territory-evaluations="$territoryEvaluations"
    />

    @if ($territoryAnalyticsType)
        <div class="card mb-5">
            <div class="card-header"><h3 class="card-title mb-0">Run {{ str($territoryAnalyticsType)->replace('_',' ')->title() }}</h3></div>
            <div class="card-body">
                <form action="{{ route('dashboard.user.titan-maps-intelligence.territories.analytics.run') }}" method="post">
                    @csrf
                    <input type="hidden" name="analysis_type" value="{{ $territoryAnalyticsType }}">
                    <div class="row g-3 align-items-end">
                        <div class="col-md-8">
                            <label class="form-label">Discovery/search area</label>
                            <select class="form-select" name="search_id" required>
                                <option value="">Choose a company-scoped discovery search…</option>
                                @foreach ($territoryAnalyticsSearches as $search)
                                    <option value="{{ $search->id }}">{{ $search->query ?: $search->purpose }} · {{ $search->created_at?->format('Y-m-d H:i') }}</option>
                                @endforeach
                            </select>
                            <div class="form-hint">The search bounds become the explicit analysis denominator. If bounds are absent, Titan derives them from the search centre/radius or observed coordinates.</div>
                        </div>
                        <div class="col-md-4"><button class="btn btn-primary w-100" type="submit">Run analysis</button></div>
                    </div>
                </form>
            </div>
        </div>

        @if ($territoryAnalyticsLatest)
            <div class="card mb-5">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h3 class="card-title mb-0">Latest evidence-backed result</h3>
                    <span class="badge bg-secondary">{{ $territoryAnalyticsLatest->methodology_key }} v{{ $territoryAnalyticsLatest->methodology_version }}</span>
                </div>
                <div class="card-body">
                    <div class="row g-3 mb-4">
                        <div class="col-md-3"><div class="text-muted small">Area</div><div class="fs-3 fw-bold">{{ number_format((float)$territoryAnalyticsLatest->area_square_km, 2) }} km²</div></div>
                        <div class="col-md-3"><div class="text-muted small">Cells</div><div class="fs-3 fw-bold">{{ number_format($territoryAnalyticsLatest->cells->count()) }}</div></div>
                        <div class="col-md-3"><div class="text-muted small">Confidence / evidence</div><div class="fs-3 fw-bold">{{ number_format(((float)$territoryAnalyticsLatest->confidence) * 100, 0) }}%</div></div>
                        <div class="col-md-3"><div class="text-muted small">Generated</div><div class="fw-bold">{{ $territoryAnalyticsLatest->generated_at?->format('Y-m-d H:i:s') ?? '—' }}</div></div>
                    </div>
                    <div class="table-responsive mb-4"><table class="table table-vcenter"><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>
                    @foreach ((array)$territoryAnalyticsLatest->generated_metrics as $metric => $value)
                        <tr><td>{{ str((string)$metric)->replace('_',' ')->title() }}</td><td>@if(is_array($value))<code>{{ json_encode($value, JSON_UNESCAPED_SLASHES) }}</code>@elseif(is_bool($value)){{ $value ? 'Yes' : 'No' }}@elseif(is_float($value)){{ number_format($value, 4) }}@else{{ $value ?? '—' }}@endif</td></tr>
                    @endforeach
                    </tbody></table></div>
                    @if ($territoryAnalyticsLatest->cells->isNotEmpty())
                        <div class="table-responsive"><table class="table table-vcenter"><thead><tr><th>Cell</th><th>Score</th><th>Evidence</th><th>Key evidence</th></tr></thead><tbody>
                        @foreach ($territoryAnalyticsLatest->cells->sortByDesc(fn($cell) => $cell->score ?? -1)->take(10) as $cell)
                            <tr><td>{{ $cell->cell_key }}</td><td>{{ $cell->score !== null ? number_format((float)$cell->score, 2) : '—' }}</td><td>{{ number_format(((float)$cell->confidence)*100,0) }}%</td><td><code>{{ json_encode(array_slice((array)$cell->metrics,0,6,true), JSON_UNESCAPED_SLASHES) }}</code></td></tr>
                        @endforeach
                        </tbody></table></div>
                    @endif
                </div>
            </div>
        @endif
    @endif

    @if ($page === 'field.dispatch')
        <div class="card mb-5">
            <div class="card-header"><h3 class="card-title mb-0">Recommend the best worker</h3></div>
            <div class="card-body">
                <form action="{{ route('dashboard.user.titan-maps-intelligence.field.dispatch.recommend') }}" method="post" data-titan-dispatch-form>
                    @csrf
                    <div class="row g-3">
                        <div class="col-md-4"><label class="form-label">Job / work order public ID</label><input class="form-control" name="job_public_id" required maxlength="191" placeholder="WO-... / public ID"></div>
                        <div class="col-md-2"><label class="form-label">Candidates</label><input class="form-control" name="limit" type="number" min="1" max="{{ $dispatchCandidateLimit }}" value="{{ min(10, $dispatchCandidateLimit) }}"></div>
                        <div class="col-md-2"><label class="form-label">Travel mode</label><select class="form-select" name="travel_mode"><option value="DRIVE">Drive</option><option value="WALK">Walk</option><option value="BICYCLE">Bicycle</option><option value="TWO_WHEELER">Two wheeler</option></select></div>
                        <div class="col-md-2"><label class="form-label">Traffic</label><select class="form-select" name="routing_preference"><option value="TRAFFIC_AWARE">Traffic aware</option><option value="TRAFFIC_AWARE_OPTIMAL">Optimal traffic</option><option value="TRAFFIC_UNAWARE">Traffic unaware</option></select></div>
                        <div class="col-md-2 d-flex align-items-end"><button class="btn btn-primary w-100" type="submit">Recommend</button></div>
                        <div class="col-12"><span class="text-muted small" data-titan-dispatch-status>Recommendation only — assignment always requires an explicit human decision.</span></div>
                    </div>
                </form>
            </div>
        </div>
        <div class="card mb-5" data-titan-dispatch-result hidden>
            <div class="card-header d-flex justify-content-between align-items-center"><h3 class="card-title mb-0">Dispatch recommendation</h3><span class="badge bg-secondary" data-titan-dispatch-state></span></div>
            <div class="card-body"><div class="mb-3" data-titan-dispatch-summary></div>
                <div class="table-responsive"><table class="table table-vcenter"><thead><tr><th>Rank</th><th>Worker</th><th>Score</th><th>ETA</th><th>Travel</th><th>Skill</th><th>Availability</th><th>Evidence / blockers</th><th>Decision</th></tr></thead><tbody data-titan-dispatch-candidates></tbody></table></div>
                <div class="alert alert-warning mt-3 mb-0">Approval records the human decision. <strong>Approve and assign</strong> additionally asks the authoritative CRM dispatch service to make the assignment; if that adapter is unavailable, the decision remains approved but assignment is reported unavailable.</div>
            </div>
        </div>
    @endif

    @if ($page === 'field.geofences')
        <div class="card mb-5">
            <div class="card-header"><h3 class="card-title mb-0">Create geofence</h3></div>
            <div class="card-body">
                <form action="{{ route('dashboard.user.titan-maps-intelligence.field.geofences.store') }}" method="post" data-titan-geofence-form>
                    @csrf
                    <input type="hidden" name="shape_type" data-geofence-shape-type>
                    <input type="hidden" name="center_latitude" data-geofence-center-lat>
                    <input type="hidden" name="center_longitude" data-geofence-center-lng>
                    <input type="hidden" name="radius_metres" data-geofence-radius>
                    <input type="hidden" name="geometry" data-geofence-geometry>
                    <div class="row g-3">
                        <div class="col-md-4"><label class="form-label">Name</label><input class="form-control" name="name" required placeholder="Front gate / Job arrival"></div>
                        <div class="col-md-2"><label class="form-label">Attach to</label><select class="form-select" name="reference_type"><option value="">General</option><option value="job">Job</option><option value="property">Property</option><option value="branch">Branch</option><option value="worker">Worker</option><option value="supplier">Supplier</option><option value="contractor">Contractor</option></select></div>
                        <div class="col-md-3"><label class="form-label">Reference ID</label><input class="form-control" name="public_reference_id" placeholder="Optional Titan public ID"></div>
                        <div class="col-md-2"><label class="form-label">Dwell seconds</label><input class="form-control" type="number" min="0" max="86400" name="dwell_seconds" value="300"></div>
                        <div class="col-md-1 d-flex align-items-end"><button class="btn btn-primary w-100" type="submit" disabled data-geofence-save>Save</button></div>
                        <div class="col-12"><div class="text-muted small" data-geofence-draw-status>Choose Draw circle or Draw polygon on the map, then save the geofence.</div></div>
                    </div>
                </form>
            </div>
        </div>
    @endif

    @if ($page === 'travel.matrix')
        <div class="card mb-5">
            <div class="card-header"><h3 class="card-title mb-0">Find nearest operational resources</h3></div>
            <div class="card-body">
                <form action="{{ route('dashboard.user.titan-maps-intelligence.travel.matrix.nearest') }}" method="post" data-titan-nearest-form>
                    @csrf
                    <div class="row g-3">
                        <div class="col-md-3"><label class="form-label">Origin latitude</label><input class="form-control" name="origin_latitude" type="number" step="any" required></div>
                        <div class="col-md-3"><label class="form-label">Origin longitude</label><input class="form-control" name="origin_longitude" type="number" step="any" required></div>
                        <div class="col-md-2"><label class="form-label">Resource type</label><select class="form-select" name="resource_type"><option value="all">All</option><option value="worker">Workers</option><option value="supplier">Suppliers</option><option value="contractor">Contractors</option></select></div>
                        <div class="col-md-2"><label class="form-label">Results</label><input class="form-control" name="limit" type="number" min="1" max="{{ $nearestResourceLimit }}" value="{{ min(10, $nearestResourceLimit) }}"></div>
                        <div class="col-md-2 d-flex align-items-end"><button type="button" class="btn btn-outline-secondary w-100" data-titan-use-current-location>Use my location</button></div>
                        <div class="col-md-3"><label class="form-label">Travel mode</label><select class="form-select" name="travel_mode"><option value="DRIVE">Drive</option><option value="WALK">Walk</option><option value="BICYCLE">Bicycle</option><option value="TWO_WHEELER">Two wheeler</option></select></div>
                        <div class="col-md-3"><label class="form-label">Traffic</label><select class="form-select" name="routing_preference"><option value="TRAFFIC_AWARE">Traffic aware</option><option value="TRAFFIC_AWARE_OPTIMAL">Traffic aware optimal</option><option value="TRAFFIC_UNAWARE">Traffic unaware</option></select></div>
                        <div class="col-md-6 d-flex align-items-end gap-3"><button class="btn btn-primary" type="submit">Compare travel times</button><span class="text-muted small" data-titan-nearest-status></span></div>
                    </div>
                </form>
            </div>
        </div>
    @endif

    @if ($page === 'travel.planner')
        <div class="card mb-5">
            <div class="card-header"><h3 class="card-title mb-0">Build multi-stop route</h3></div>
            <div class="card-body">
                <form action="{{ route('dashboard.user.titan-maps-intelligence.travel.planner.store') }}" method="post" data-titan-route-plan-form data-max-stops="{{ $routePlanMaximumStops }}">
                    @csrf
                    <div class="row g-3 mb-4">
                        <div class="col-md-4"><label class="form-label">Plan name</label><input class="form-control" name="name" required value="Today's route"></div>
                        <div class="col-md-2"><label class="form-label">Service date</label><input class="form-control" type="date" name="service_date" value="{{ now()->format('Y-m-d') }}"></div>
                        <div class="col-md-2"><label class="form-label">Start time</label><input class="form-control" type="datetime-local" name="start_at" value="{{ now()->format('Y-m-d\\TH:i') }}"></div>
                        <div class="col-md-2"><label class="form-label">Travel mode</label><select class="form-select" name="travel_mode"><option value="DRIVE">Drive</option><option value="WALK">Walk</option><option value="BICYCLE">Bicycle</option><option value="TWO_WHEELER">Two wheeler</option></select></div>
                        <div class="col-md-2"><label class="form-label">Traffic</label><select class="form-select" name="routing_preference"><option value="TRAFFIC_AWARE">Traffic aware</option><option value="TRAFFIC_AWARE_OPTIMAL">Traffic optimal</option><option value="TRAFFIC_UNAWARE">Traffic unaware</option></select></div>
                        <div class="col-md-3"><label class="form-label">Worker public ID</label><input class="form-control" name="worker_public_id" placeholder="Optional"></div>
                        <div class="col-md-5 d-flex align-items-end"><label class="form-check"><input class="form-check-input" type="checkbox" name="render_geometry" value="1"><span class="form-check-label">Render road geometry (extra provider calls, up to configured segment limit)</span></label></div>
                        <div class="col-md-4 d-flex align-items-end gap-3"><button class="btn btn-primary" type="submit">Create and optimise</button><button class="btn btn-outline-secondary" type="button" data-route-plan-add-stop>Add stop</button></div>
                    </div>
                    <div class="table-responsive"><table class="table table-vcenter"><thead><tr><th>#</th><th>Type</th><th>Label</th><th>Latitude</th><th>Longitude</th><th>Service min</th><th>Window start</th><th>Window end</th><th>Lock</th><th></th></tr></thead><tbody data-route-plan-stops></tbody></table></div>
                    <div class="text-muted small mt-2">First stop is always the start anchor. Locked stops keep their route position. Add the depot again as the last stop if the route must return to base.</div>
                    <div class="text-muted small mt-2" data-route-plan-status></div>
                </form>
            </div>
        </div>
        <div class="card mb-5" data-route-plan-result hidden>
            <div class="card-header d-flex justify-content-between align-items-center"><h3 class="card-title mb-0">Optimised route</h3><button class="btn btn-sm btn-outline-secondary" type="button" data-route-plan-reoptimise>Re-optimise remaining stops</button></div>
            <div class="card-body">
                <div class="row g-3 mb-4" data-route-plan-metrics></div>
                <div class="alert alert-warning py-2" data-route-plan-warning hidden></div>
                <div class="table-responsive"><table class="table table-vcenter"><thead><tr><th>#</th><th>Stop</th><th>Type</th><th>Arrival</th><th>Window</th><th>Status</th><th>Actions</th></tr></thead><tbody data-route-plan-result-stops></tbody></table></div>
                <hr>
                <form class="row g-3" data-route-plan-emergency-form>
                    <div class="col-md-3"><label class="form-label">Emergency stop</label><input class="form-control" name="label" required placeholder="Urgent job"></div>
                    <div class="col-md-2"><label class="form-label">Latitude</label><input class="form-control" name="latitude" type="number" step="any" required></div>
                    <div class="col-md-2"><label class="form-label">Longitude</label><input class="form-control" name="longitude" type="number" step="any" required></div>
                    <div class="col-md-2"><label class="form-label">Service min</label><input class="form-control" name="service_minutes" type="number" min="0" value="30"></div>
                    <div class="col-md-3 d-flex align-items-end"><button class="btn btn-outline-primary" type="submit">Insert emergency and reroute</button></div>
                </form>
            </div>
        </div>
    @endif

    @if ($page === 'travel.route')
        <div class="card mb-5">
            <div class="card-header"><h3 class="card-title mb-0">Calculate a road route</h3></div>
            <div class="card-body">
                <form action="{{ route('dashboard.user.titan-maps-intelligence.travel.route.calculate') }}" method="post" data-titan-route-form>
                    @csrf
                    <div class="row g-3">
                        <div class="col-md-3"><label class="form-label">Origin latitude</label><input class="form-control" name="origin_latitude" type="number" step="any" required></div>
                        <div class="col-md-3"><label class="form-label">Origin longitude</label><input class="form-control" name="origin_longitude" type="number" step="any" required></div>
                        <div class="col-md-3"><label class="form-label">Destination latitude</label><input class="form-control" name="destination_latitude" type="number" step="any" required></div>
                        <div class="col-md-3"><label class="form-label">Destination longitude</label><input class="form-control" name="destination_longitude" type="number" step="any" required></div>
                        <div class="col-md-3"><label class="form-label">Travel mode</label><select class="form-select" name="travel_mode"><option value="DRIVE">Drive</option><option value="WALK">Walk</option><option value="BICYCLE">Bicycle</option><option value="TWO_WHEELER">Two wheeler</option><option value="TRANSIT">Transit</option></select></div>
                        <div class="col-md-3"><label class="form-label">Traffic</label><select class="form-select" name="routing_preference"><option value="TRAFFIC_AWARE">Traffic aware</option><option value="TRAFFIC_AWARE_OPTIMAL">Traffic aware optimal</option><option value="TRAFFIC_UNAWARE">Traffic unaware</option></select></div>
                        <div class="col-md-3"><label class="form-label">Departure time</label><input class="form-control" name="departure_time" type="datetime-local"><div class="form-hint">Optional; provider interpretation applies.</div></div>
                        <div class="col-md-9 d-flex align-items-end gap-3"><button class="btn btn-primary" type="submit">Calculate route</button><span class="text-muted small" data-titan-route-status></span></div>
                    </div>
                </form>
            </div>
        </div>
    @endif

    @if ($mapPayload)
        <x-titan-maps-intelligence::map-canvas
            :payload="$mapPayload"
            :ui="$mapUi"
            :title="$title"
            subtitle="Interactive graphical map · drag to pan · wheel or controls to zoom"
        />
    @endif



    @if ($page === 'travel.matrix' && $matrixHistory->isNotEmpty())
        <div class="card mb-5">
            <div class="card-header"><h3 class="card-title mb-0">Recent matrix calculations</h3></div>
            <div class="table-responsive"><table class="table table-vcenter card-table">
                <thead><tr><th>Basis</th><th>Size</th><th>Provider</th><th>Calculated</th><th>Freshness</th></tr></thead>
                <tbody>
                @foreach ($matrixHistory as $matrix)
                    <tr>
                        <td>{{ str((string) $matrix->result_basis)->replace('_',' ')->title() }}</td>
                        <td>{{ (int) $matrix->origin_count }} × {{ (int) $matrix->destination_count }} ({{ (int) $matrix->element_count }})</td>
                        <td>{{ $matrix->provider ?: 'Estimate only' }}</td>
                        <td>{{ $matrix->calculated_at?->format('Y-m-d H:i:s') ?? '—' }}</td>
                        <td>{{ $matrix->result_basis === 'provider_matrix' ? (($matrix->stale_at && $matrix->stale_at->isPast()) ? 'Stale' : 'Fresh / cacheable') : ($matrix->result_basis === 'stale_matrix_snapshot' ? 'Stale snapshot' : 'Estimate only') }}</td>
                    </tr>
                @endforeach
                </tbody>
            </table></div>
        </div>
    @endif

    @if ($page === 'travel.matrix')
        <div class="card mb-5" data-titan-nearest-result-card hidden>
            <div class="card-header"><h3 class="card-title mb-0">Nearest by travel time</h3></div>
            <div class="table-responsive"><table class="table table-vcenter card-table">
                <thead><tr><th>Rank</th><th>Resource</th><th>Type</th><th>Distance</th><th>ETA</th><th>Traffic delay</th><th>Basis</th></tr></thead>
                <tbody data-titan-nearest-results></tbody>
            </table></div>
        </div>
    @endif

    @if (str_starts_with($page, 'travel.') && $routeHistory->isNotEmpty())
        <div class="card mb-5">
            <div class="card-header"><h3 class="card-title mb-0">Route and ETA history</h3></div>
            <div class="table-responsive"><table class="table table-vcenter card-table">
                <thead><tr><th>Basis</th><th>Distance</th><th>ETA</th><th>Traffic</th><th>Freshness</th><th>Calculated</th></tr></thead>
                <tbody>
                @foreach ($routeHistory as $route)
                    @php
                        $eta = $route->eta;
                        $distanceText = $route->road_distance_metres !== null
                            ? number_format(((int) $route->road_distance_metres) / 1000, 1).' km road'
                            : number_format(((int) $route->straight_line_distance_metres) / 1000, 1).' km straight-line estimate';
                        $etaText = $eta?->duration_seconds !== null ? max(1, (int) round(((int) $eta->duration_seconds) / 60)).' min' : 'Unavailable';
                        $freshness = $route->result_basis === 'provider_route'
                            ? (($route->stale_at && $route->stale_at->isPast()) ? 'Stale' : 'Fresh')
                            : ($route->result_basis === 'last_valid_snapshot' ? 'Stale snapshot' : 'Estimate only');
                    @endphp
                    <tr>
                        <td>{{ str((string) $route->result_basis)->replace('_',' ')->title() }}</td>
                        <td>{{ $distanceText }}</td>
                        <td>{{ $etaText }}</td>
                        <td>{{ str((string) ($eta?->traffic_basis ?? 'unavailable'))->replace('_',' ')->title() }}</td>
                        <td>{{ $freshness }}</td>
                        <td>{{ $route->calculated_at?->format('Y-m-d H:i:s') ?? '—' }}</td>
                    </tr>
                @endforeach
                </tbody>
            </table></div>
        </div>
    @endif

    @if ($showSearch)
        <div class="card mb-5"><div class="card-body">
            <x-titan-maps-intelligence::search-composer
                :default-purpose="$searchProfile['default_purpose']"
                :legend="$searchProfile['legend']"
                :placeholder="$searchProfile['placeholder']"
                :button-label="$searchProfile['button_label']"
                :hint="$searchProfile['hint']"
            />
        </div></div>
    @endif


    @if ($page === 'field.geofences' && $geofenceEvents->isNotEmpty())
        <div class="card mb-5">
            <div class="card-header"><h3 class="card-title mb-0">Recent geofence events</h3></div>
            <div class="table-responsive"><table class="table table-vcenter card-table">
                <thead><tr><th>Event</th><th>Worker</th><th>Reference</th><th>Occurred</th><th>Confirmation</th></tr></thead>
                <tbody>
                @foreach ($geofenceEvents as $event)
                    <tr>
                        <td>{{ str($event->event_type)->replace('_',' ')->title() }}</td>
                        <td>{{ $event->worker_public_id }}</td>
                        <td>{{ $event->reference_type ? str($event->reference_type)->title().' '.$event->public_reference_id : 'General geofence' }}</td>
                        <td>{{ $event->occurred_at?->format('Y-m-d H:i:s') ?? '—' }}</td>
                        <td>
                            @if ($event->confirmation_status === 'pending')
                                <div class="d-flex gap-2">
                                    <button type="button" class="btn btn-sm btn-primary" data-geofence-confirm data-endpoint="{{ route('dashboard.user.titan-maps-intelligence.field.geofence-events.confirm', ['eventId'=>$event->id]) }}" data-approved="1">Confirm</button>
                                    <button type="button" class="btn btn-sm btn-outline-secondary" data-geofence-confirm data-endpoint="{{ route('dashboard.user.titan-maps-intelligence.field.geofence-events.confirm', ['eventId'=>$event->id]) }}" data-approved="0">Reject</button>
                                </div>
                            @else
                                {{ str($event->confirmation_status)->title() }}
                            @endif
                        </td>
                    </tr>
                @endforeach
                </tbody>
            </table></div>
        </div>
    @endif

    @if ($recordTable !== null)
        <div class="card" data-titan-maps-record-table="{{ $page }}">
            <div class="card-header"><h3 class="card-title mb-0">{{ $recordTable['title'] }}</h3></div>
            @if ($recordTable['rows'] !== [])
                <div class="table-responsive">
                    <table class="table table-vcenter card-table">
                        <thead><tr>@foreach ($recordTable['columns'] as $column)<th>{{ $column }}</th>@endforeach</tr></thead>
                        <tbody>
                        @foreach ($recordTable['rows'] as $recordRow)
                            <tr>@foreach ($recordRow as $cell)<td>{{ $cell }}</td>@endforeach</tr>
                        @endforeach
                        </tbody>
                    </table>
                </div>
            @else
                <div class="card-body text-muted">{{ $recordTable['empty_message'] }}</div>
            @endif
        </div>
    @endif
</div>
@if ($mapPayload)
    <script src="{{ route('dashboard.user.titan-maps-intelligence.assets.show', ['asset' => 'titan-map-engine.js', 'v' => '2.0.0-beta.1.9']) }}"></script>
@endif
<script src="{{ route('dashboard.user.titan-maps-intelligence.assets.show', ['asset' => 'titan-maps-intelligence.js', 'v' => '2.0.0-beta.1.9']) }}"></script>
@endsection

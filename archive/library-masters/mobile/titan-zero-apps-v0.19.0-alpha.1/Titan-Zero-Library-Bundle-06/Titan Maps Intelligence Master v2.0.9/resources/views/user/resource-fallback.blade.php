@extends('panel.layout.app')

@section('content')
<link rel="stylesheet" href="{{ route('dashboard.user.titan-maps-intelligence.assets.show', ['asset' => 'titan-map-engine.css', 'v' => '2.0.0-beta.1.9']) }}">

<div class="container-fluid py-6" data-titan-maps-resource-fallback>
    <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-5">
        <div>
            <h1 class="mb-1">Resource Fallback</h1>
            <p class="text-muted mb-0">Internal first → approved network → Maps Discovery. Discovery never auto-promotes or auto-assigns.</p>
        </div>
        @if ($selected && !in_array((string) $selected->status, ['promoted', 'cancelled', 'failed', 'closed'], true))
            <form method="POST" action="{{ route('dashboard.user.titan-maps-intelligence.field.resource-fallback.cancel', ['mapsResourceFallback' => $selected->id]) }}">
                @csrf
                <input type="hidden" name="reason" value="Cancelled from Resource Fallback page">
                <button class="btn btn-outline-secondary" type="submit">Cancel request</button>
            </form>
        @endif
    </div>

    @if (session('status'))
        <div class="alert alert-success">{{ session('status') }}</div>
    @endif
    @if ($errors->any())
        <div class="alert alert-danger">
            <strong>Resource fallback could not be updated.</strong>
            <ul class="mb-0 mt-2">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <div class="row g-5">
        <div class="col-12 col-xl-4">
            <div class="card mb-5">
                <div class="card-header"><h3 class="card-title mb-0">Start fallback search</h3></div>
                <div class="card-body">
                    <form method="POST" action="{{ route('dashboard.user.titan-maps-intelligence.field.resource-fallback.start') }}">
                        @csrf
                        <div class="mb-3">
                            <label class="form-label" for="fallback_resource_type">Resource type</label>
                            <select class="form-select" id="fallback_resource_type" name="resource_type" required>
                                <option value="contractor" @selected(old('resource_type') === 'contractor')>Contractor</option>
                                <option value="supplier" @selected(old('resource_type') === 'supplier')>Supplier</option>
                            </select>
                        </div>
                        <div class="row g-3 mb-3">
                            <div class="col-6">
                                <label class="form-label" for="fallback_need_type">Operational need</label>
                                <select class="form-select" id="fallback_need_type" name="operational_need_type">
                                    <option value="manual" @selected(old('operational_need_type') === 'manual')>Manual</option>
                                    <option value="job" @selected(old('operational_need_type') === 'job')>Job</option>
                                    <option value="inventory_shortage" @selected(old('operational_need_type') === 'inventory_shortage')>Titan Gear shortage</option>
                                </select>
                            </div>
                            <div class="col-6">
                                <label class="form-label" for="fallback_need_id">Need public ID</label>
                                <input class="form-control" id="fallback_need_id" name="operational_need_public_id" value="{{ old('operational_need_public_id') }}" placeholder="Shortage/job reference">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label" for="fallback_job_public_id">Mapped job public ID</label>
                            <input class="form-control" id="fallback_job_public_id" name="job_public_id" value="{{ old('job_public_id') }}" placeholder="Optional when coordinates are provided">
                            <div class="form-text">For contractor requests, a mapped job also lets Titan test internal dispatch capacity before external sourcing.</div>
                        </div>
                        <div class="row g-3 mb-3">
                            <div class="col-6">
                                <label class="form-label" for="fallback_latitude">Latitude</label>
                                <input class="form-control" id="fallback_latitude" name="latitude" type="number" step="any" min="-90" max="90" value="{{ old('latitude') }}">
                            </div>
                            <div class="col-6">
                                <label class="form-label" for="fallback_longitude">Longitude</label>
                                <input class="form-control" id="fallback_longitude" name="longitude" type="number" step="any" min="-180" max="180" value="{{ old('longitude') }}">
                            </div>
                        </div>
                        <div class="mb-3">
                            <button class="btn btn-sm btn-outline-secondary" type="button" data-titan-fallback-use-location>Use my location</button>
                        </div>
                        <div class="mb-3">
                            <label class="form-label" for="fallback_service_key">Service / trade key</label>
                            <input class="form-control" id="fallback_service_key" name="service_key" value="{{ old('service_key') }}" placeholder="e.g. emergency-plumbing">
                        </div>
                        <div class="mb-3">
                            <label class="form-label" for="fallback_query">Discovery query</label>
                            <input class="form-control" id="fallback_query" name="query" value="{{ old('query') }}" placeholder="Optional search wording">
                        </div>
                        <div class="row g-3 mb-3">
                            <div class="col-6">
                                <label class="form-label" for="fallback_radius">Radius (m)</label>
                                <input class="form-control" id="fallback_radius" name="radius_metres" type="number" min="100" max="50000" value="{{ old('radius_metres', (int) $defaultRadius) }}">
                            </div>
                            <div class="col-6">
                                <label class="form-label" for="fallback_mode">Travel mode</label>
                                <select class="form-select" id="fallback_mode" name="travel_mode">
                                    @foreach (['DRIVE' => 'Drive', 'WALK' => 'Walk', 'BICYCLE' => 'Bicycle', 'TWO_WHEELER' => 'Two wheeler'] as $value => $label)
                                        <option value="{{ $value }}" @selected(old('travel_mode', 'DRIVE') === $value)>{{ $label }}</option>
                                    @endforeach
                                </select>
                            </div>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" id="fallback_open_now" name="open_now" type="checkbox" value="1" @checked(old('open_now'))>
                            <label class="form-check-label" for="fallback_open_now">Prefer businesses open now during discovery</label>
                        </div>
                        <div class="mb-4">
                            <label class="form-label" for="fallback_routing">Routing preference</label>
                            <select class="form-select" id="fallback_routing" name="routing_preference">
                                @foreach (['TRAFFIC_AWARE' => 'Traffic aware', 'TRAFFIC_AWARE_OPTIMAL' => 'Traffic aware optimal', 'TRAFFIC_UNAWARE' => 'Traffic unaware'] as $value => $label)
                                    <option value="{{ $value }}" @selected(old('routing_preference', 'TRAFFIC_AWARE') === $value)>{{ $label }}</option>
                                @endforeach
                            </select>
                        </div>
                        <button class="btn btn-primary w-100" type="submit">Start governed fallback</button>
                    </form>
                </div>
            </div>

            <div class="card">
                <div class="card-header"><h3 class="card-title mb-0">Recent requests</h3></div>
                <div class="list-group list-group-flush">
                    @forelse ($history as $item)
                        <a class="list-group-item list-group-item-action {{ $selected && (string) $selected->id === (string) $item->id ? 'active' : '' }}" href="{{ route('dashboard.user.titan-maps-intelligence.field.resource-fallback', ['request_id' => $item->id]) }}">
                            <div class="d-flex justify-content-between gap-2">
                                <strong>{{ ucfirst((string) $item->resource_type) }}</strong>
                                <span class="small">{{ $item->candidates_count }} candidates</span>
                            </div>
                            <div class="small mt-1">{{ str_replace('_', ' ', (string) $item->status) }}</div>
                            <div class="small opacity-75">{{ $item->operational_need_public_id ? ucwords(str_replace('_', ' ', (string) $item->operational_need_type)).' '.$item->operational_need_public_id : ($item->job_public_id ? 'Job '.$item->job_public_id : ($item->query ?: 'Coordinate target')) }}</div>
                        </a>
                    @empty
                        <div class="p-4 text-muted">No fallback requests yet.</div>
                    @endforelse
                </div>
            </div>
        </div>

        <div class="col-12 col-xl-8">
            @if (!$selected)
                <div class="card">
                    <div class="card-body py-8 text-center">
                        <h3>No fallback request selected</h3>
                        <p class="text-muted mb-0">Start a request or select one from history to inspect the sourcing evidence.</p>
                    </div>
                </div>
            @else
                <div class="row g-3 mb-5">
                    <div class="col-6 col-md-3"><div class="card h-100"><div class="card-body"><div class="text-muted small">Status</div><strong>{{ ucwords(str_replace('_', ' ', (string) $selected->status)) }}</strong></div></div></div>
                    <div class="col-6 col-md-3"><div class="card h-100"><div class="card-body"><div class="text-muted small">Internal</div><strong>{{ ucwords(str_replace('_', ' ', (string) $selected->internal_check_status)) }}</strong></div></div></div>
                    <div class="col-6 col-md-3"><div class="card h-100"><div class="card-body"><div class="text-muted small">Approved network</div><strong>{{ ucwords(str_replace('_', ' ', (string) $selected->approved_network_status)) }}</strong></div></div></div>
                    <div class="col-6 col-md-3"><div class="card h-100"><div class="card-body"><div class="text-muted small">Candidates</div><strong>{{ $selected->candidates->count() }}</strong></div></div></div>
                </div>

                @if ((string) $selected->status === 'internal_available')
                    <div class="alert alert-info"><strong>Internal capacity is available.</strong> Use Dispatch Intelligence for the internal worker. Titan did not open external discovery.</div>
                @elseif ((string) $selected->status === 'approved_network_review')
                    <div class="alert alert-info"><strong>Approved network candidates found.</strong> Titan stopped before Maps Discovery. Review an existing operational resource below; no promotion step is required.</div>
                @elseif (in_array((string) $selected->status, ['discovery_searching', 'discovery_review'], true))
                    <div class="alert alert-warning"><strong>Maps Discovery fallback.</strong> This stage was only opened after prior sourcing stages were exhausted. Discovery candidates require review and explicit promotion before CRM/operations can use them.</div>
                @endif

                @if ((string) $selected->status === 'discovery_searching')
                    <div class="mb-4">
                        <form method="POST" action="{{ route('dashboard.user.titan-maps-intelligence.field.resource-fallback.refresh', ['mapsResourceFallback' => $selected->id]) }}">
                            @csrf
                            <button class="btn btn-outline-primary" type="submit">Refresh discovery results</button>
                            @if ($selected->discoverySearch)
                                <span class="text-muted ms-2">Search: {{ ucwords(str_replace('_', ' ', (string) $selected->discoverySearch->status)) }}</span>
                            @endif
                        </form>
                    </div>
                @endif

                <x-titan-maps-intelligence::map-canvas
                    :payload="$mapPayload"
                    :ui="$mapUi"
                    title="Fallback candidate map"
                    subtitle="Dashed lines compare candidate location to the target; they are not presented as road geometry."
                />

                <div class="card mb-5">
                    <div class="card-header d-flex align-items-center">
                        <h3 class="card-title mb-0">Candidate evidence</h3>
                        <span class="ms-auto text-muted small">Request {{ $selected->id }}</span>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-vcenter card-table">
                            <thead>
                                <tr>
                                    <th>Rank</th><th>Candidate</th><th>Source</th><th>Fit</th><th>Travel</th><th>Service evidence</th><th>Status</th><th class="text-end">Review</th>
                                </tr>
                            </thead>
                            <tbody>
                            @forelse ($selected->candidates as $candidate)
                                @php
                                    $distance = $candidate->road_distance_metres ?? $candidate->straight_line_distance_metres;
                                    $distanceLabel = $distance !== null ? number_format(((int) $distance) / 1000, 1).' km' : 'Unavailable';
                                    $etaLabel = $candidate->duration_seconds !== null ? (string) max(1, (int) round(((int) $candidate->duration_seconds) / 60)).' min' : 'ETA unavailable';
                                    $serviceEvidence = (string) ($candidate->service_evidence ?? 'unknown');
                                    $isSelected = (string) ($selected->selected_candidate_id ?? '') === (string) $candidate->id;
                                @endphp
                                <tr>
                                    <td>#{{ $candidate->rank ?: '—' }}</td>
                                    <td>
                                        <strong>{{ $candidate->label }}</strong>
                                        @if ($candidate->subtitle)<div class="text-muted small">{{ $candidate->subtitle }}</div>@endif
                                        @if ($isSelected)<div class="small mt-1"><span class="badge bg-primary">Selected</span></div>@endif
                                    </td>
                                    <td>{{ ucwords(str_replace('_', ' ', (string) $candidate->source)) }}</td>
                                    <td>{{ $candidate->fit_score !== null ? number_format((float) $candidate->fit_score, 1) : '—' }}</td>
                                    <td>
                                        <div>{{ $etaLabel }}</div>
                                        <div class="text-muted small">{{ $distanceLabel }} · {{ str_replace('_', ' ', (string) ($candidate->eta_basis ?: 'unavailable')) }}</div>
                                    </td>
                                    <td>
                                        <div>{{ $serviceEvidence === 'unknown' ? 'Unknown' : (ucwords(str_replace('_', ' ', $serviceEvidence)).($candidate->service_match !== null ? ' · '.number_format((float) $candidate->service_match * 100, 0).'%' : '')) }}</div>
                                        @if (!empty($candidate->explanations))
                                            <div class="text-muted small">{{ implode(' · ', array_slice(array_map('strval', (array) $candidate->explanations), 0, 2)) }}</div>
                                        @endif
                                    </td>
                                    <td>{{ ucwords(str_replace('_', ' ', (string) $candidate->status)) }}</td>
                                    <td class="text-end">
                                        @if ((string) $candidate->source === 'internal')
                                            <span class="text-muted small">Use Dispatch Intelligence</span>
                                        @elseif ((string) $candidate->status === 'promoted')
                                            <span class="badge bg-success">Promoted</span>
                                        @elseif ((string) $candidate->status === 'approved' && (string) $candidate->source === 'approved_network')
                                            <span class="text-muted small">Existing approved resource — no promotion required</span>
                                        @elseif ((string) $candidate->status === 'approved' && (string) $candidate->source === 'discovery')
                                            <form class="d-inline" method="POST" action="{{ route('dashboard.user.titan-maps-intelligence.field.resource-fallback.promote', ['mapsResourceFallback' => $selected->id]) }}">
                                                @csrf
                                                <input type="hidden" name="candidate_id" value="{{ $candidate->id }}">
                                                <input type="hidden" name="confirmed" value="1">
                                                @foreach (['name','phone','website','address','categories'] as $field)
                                                    <input type="hidden" name="accepted_fields[]" value="{{ $field }}">
                                                @endforeach
                                                <button class="btn btn-sm btn-primary" type="submit">Promote to {{ ucfirst((string) $selected->resource_type) }}</button>
                                            </form>
                                        @elseif (!in_array((string) $candidate->status, ['rejected'], true))
                                            <form class="d-inline" method="POST" action="{{ route('dashboard.user.titan-maps-intelligence.field.resource-fallback.decide', ['mapsResourceFallback' => $selected->id]) }}">
                                                @csrf
                                                <input type="hidden" name="candidate_id" value="{{ $candidate->id }}">
                                                <input type="hidden" name="decision" value="approve">
                                                <button class="btn btn-sm btn-outline-primary" type="submit">Approve</button>
                                            </form>
                                            <form class="d-inline" method="POST" action="{{ route('dashboard.user.titan-maps-intelligence.field.resource-fallback.decide', ['mapsResourceFallback' => $selected->id]) }}">
                                                @csrf
                                                <input type="hidden" name="candidate_id" value="{{ $candidate->id }}">
                                                <input type="hidden" name="decision" value="reject">
                                                <input type="hidden" name="reason" value="Rejected during fallback review">
                                                <button class="btn btn-sm btn-outline-secondary" type="submit">Reject</button>
                                            </form>
                                        @else
                                            <span class="text-muted small">Rejected</span>
                                        @endif
                                    </td>
                                </tr>
                            @empty
                                <tr><td colspan="8" class="text-center text-muted py-5">No candidates are available for this request yet.</td></tr>
                            @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>

                @if ($selected->decisions->isNotEmpty())
                    <div class="card">
                        <div class="card-header"><h3 class="card-title mb-0">Decision trail</h3></div>
                        <div class="table-responsive">
                            <table class="table table-vcenter card-table">
                                <thead><tr><th>Decision</th><th>Candidate</th><th>Reason</th><th>When</th></tr></thead>
                                <tbody>
                                @foreach ($selected->decisions as $decision)
                                    <tr>
                                        <td>{{ ucwords(str_replace('_', ' ', (string) $decision->decision)) }}</td>
                                        <td>{{ $decision->fallback_candidate_id ?: '—' }}</td>
                                        <td>{{ $decision->reason ?: '—' }}</td>
                                        <td>{{ $decision->decided_at ? $decision->decided_at->format('Y-m-d H:i') : '—' }}</td>
                                    </tr>
                                @endforeach
                                </tbody>
                            </table>
                        </div>
                    </div>
                @endif
            @endif
        </div>
    </div>
</div>

<script src="{{ route('dashboard.user.titan-maps-intelligence.assets.show', ['asset' => 'titan-map-engine.js', 'v' => '2.0.0-beta.1.9']) }}"></script>
<script src="{{ route('dashboard.user.titan-maps-intelligence.assets.show', ['asset' => 'titan-maps-intelligence.js', 'v' => '2.0.0-beta.1.9']) }}"></script>
<script>
document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-titan-fallback-use-location]');
    if (!button || !navigator.geolocation) return;
    button.disabled = true;
    navigator.geolocation.getCurrentPosition(function (position) {
        var lat = document.getElementById('fallback_latitude');
        var lng = document.getElementById('fallback_longitude');
        if (lat) lat.value = position.coords.latitude.toFixed(7);
        if (lng) lng.value = position.coords.longitude.toFixed(7);
        button.disabled = false;
    }, function () { button.disabled = false; }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
});
</script>
@endsection

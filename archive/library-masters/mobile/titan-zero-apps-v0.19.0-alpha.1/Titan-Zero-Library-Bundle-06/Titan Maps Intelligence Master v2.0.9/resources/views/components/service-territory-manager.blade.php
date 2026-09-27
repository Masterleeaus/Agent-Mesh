@props([
    'page',
    'serviceTerritories' => collect(),
    'branchLocations' => collect(),
    'territoryEvaluations' => collect(),
])

@if ($page === 'territories.service-areas')
<div class="card mb-5">
    <div class="card-header"><h3 class="card-title mb-0">Create service area</h3></div>
    <div class="card-body">
        <form action="{{ route('dashboard.user.titan-maps-intelligence.territories.service-areas.store') }}" method="post" data-titan-service-territory-form>
            @csrf
            <input type="hidden" name="center_latitude" data-territory-center-lat>
            <input type="hidden" name="center_longitude" data-territory-center-lng>
            <input type="hidden" name="radius_metres" data-territory-radius>
            <input type="hidden" name="geometry" data-territory-geometry>
            <div class="row g-3">
                <div class="col-md-3"><label class="form-label">Name</label><input class="form-control" name="name" required maxlength="191" placeholder="Primary service area"></div>
                <div class="col-md-2"><label class="form-label">Effect</label><select class="form-select" name="effect"><option value="include">Include</option><option value="exclude">Exclude</option></select></div>
                <div class="col-md-2"><label class="form-label">Rule</label><select class="form-select" name="match_mode" data-territory-match-mode><option value="circle">Circle</option><option value="polygon">Polygon</option><option value="postcode">Postcode</option><option value="suburb">Suburb</option></select></div>
                <div class="col-md-2"><label class="form-label">Priority</label><input class="form-control" name="priority" type="number" value="100"></div>
                <div class="col-md-3"><label class="form-label">Service keys</label><input class="form-control" name="service_keys" placeholder="cleaning, plumbing (optional)"></div>
                <div class="col-md-6" data-territory-locality-wrap hidden><label class="form-label">Postcodes / suburbs</label><textarea class="form-control" rows="2" name="locality_values" placeholder="One per line or comma separated"></textarea><div class="form-hint">Exact normalized text matching. Titan does not invent a geographic polygon for locality rules.</div></div>
                <div class="col-md-2"><label class="form-label">Pricing hint</label><select class="form-select" name="pricing_hint_type"><option value="">None</option><option value="fixed">Fixed</option><option value="percent">Percent</option></select></div>
                <div class="col-md-2"><label class="form-label">Hint value</label><input class="form-control" name="pricing_hint_value" type="number" step="0.01" min="0"></div>
                <div class="col-md-2"><label class="form-label">Currency</label><input class="form-control" name="pricing_hint_currency" value="AUD" maxlength="8"></div>
                <div class="col-md-12 d-flex align-items-end gap-3"><button class="btn btn-primary" type="submit" data-territory-save>Save service area</button><span class="text-muted small" data-territory-draw-status>For circle/polygon, use the Draw controls on the map first.</span></div>
            </div>
        </form>
    </div>
</div>
@endif

@if ($page === 'territories.travel-zones')
<div class="card mb-5">
    <div class="card-header"><h3 class="card-title mb-0">Create branch travel zone</h3></div>
    <div class="card-body">
        <form action="{{ route('dashboard.user.titan-maps-intelligence.territories.travel-zones.store') }}" method="post">
            @csrf
            <div class="row g-3">
                <div class="col-md-3"><label class="form-label">Name</label><input class="form-control" name="name" required placeholder="Branch A — 30 minute zone"></div>
                <div class="col-md-2"><label class="form-label">Effect</label><select class="form-select" name="effect"><option value="include">Include</option><option value="exclude">Exclude</option></select></div>
                <div class="col-md-2"><label class="form-label">Travel rule</label><select class="form-select" name="match_mode" data-travel-zone-mode><option value="drive_time">Drive time</option><option value="road_distance">Road distance</option></select></div>
                <div class="col-md-3"><label class="form-label">Branch</label><select class="form-select" name="branch_public_id" required><option value="">Choose branch</option>@foreach($branchLocations as $branch)<option value="{{ $branch->public_reference_id }}">{{ $branch->public_reference_id }}</option>@endforeach</select></div>
                <div class="col-md-2"><label class="form-label">Priority</label><input class="form-control" name="priority" type="number" value="100"></div>
                <div class="col-md-3"><label class="form-label">Max drive minutes</label><input class="form-control" name="maximum_drive_time_minutes" type="number" min="1" value="30" data-travel-zone-minutes></div>
                <div class="col-md-3"><label class="form-label">Max road km</label><input class="form-control" name="maximum_road_distance_km" type="number" step="0.1" min="0.1" value="25" data-travel-zone-km></div>
                <div class="col-md-3"><label class="form-label">Service keys</label><input class="form-control" name="service_keys" placeholder="Optional"></div>
                <div class="col-md-1"><label class="form-label">Hint</label><select class="form-select" name="pricing_hint_type"><option value="">None</option><option value="fixed">Fixed</option><option value="percent">%</option></select></div>
                <div class="col-md-1"><label class="form-label">Value</label><input class="form-control" name="pricing_hint_value" type="number" step="0.01" min="0"></div>
                <div class="col-md-1"><label class="form-label">Currency</label><input class="form-control" name="pricing_hint_currency" value="AUD"></div>
                <div class="col-md-12"><button class="btn btn-primary" type="submit">Save travel zone</button></div>
            </div>
        </form>
        @if($branchLocations->isEmpty())<div class="alert alert-warning mt-3 mb-0">No canonical branch locations exist yet. Geocode/add a branch location before creating travel zones.</div>@endif
    </div>
</div>
@endif

@if ($page === 'territories.geographic-pricing')
<div class="card mb-5">
    <div class="card-header"><h3 class="card-title mb-0">Evaluate geographic coverage and pricing signals</h3></div>
    <div class="card-body">
        <form action="{{ route('dashboard.user.titan-maps-intelligence.territories.geographic-pricing.evaluate') }}" method="post" data-titan-territory-evaluation-form>
            @csrf
            <div class="row g-3">
                <div class="col-md-2"><label class="form-label">Latitude</label><input class="form-control" name="latitude" type="number" step="any"></div>
                <div class="col-md-2"><label class="form-label">Longitude</label><input class="form-control" name="longitude" type="number" step="any"></div>
                <div class="col-md-2"><label class="form-label">Suburb</label><input class="form-control" name="suburb"></div>
                <div class="col-md-1"><label class="form-label">Postcode</label><input class="form-control" name="postcode"></div>
                <div class="col-md-2"><label class="form-label">Service key</label><input class="form-control" name="service_key" placeholder="Optional"></div>
                <div class="col-md-1 d-flex align-items-end"><button type="button" class="btn btn-outline-secondary w-100" data-territory-use-current-location>GPS</button></div>
                <div class="col-md-2 d-flex align-items-end"><button class="btn btn-primary w-100" type="submit">Evaluate</button></div>
            </div>
        </form>
        <div class="alert alert-info mt-3 mb-0">Signals are advisory only. Titan Maps does not apply any fixed or percentage amount to a quote, invoice or payment.</div>
    </div>
</div>

@if($territoryEvaluations->isNotEmpty())
<div class="card mb-5">
    <div class="card-header"><h3 class="card-title mb-0">Recent evaluations</h3></div>
    <div class="table-responsive"><table class="table table-vcenter card-table">
        <thead><tr><th>Covered</th><th>Branch</th><th>Road distance</th><th>Drive time</th><th>Basis</th><th>Signals</th><th>Evaluated</th></tr></thead>
        <tbody>@foreach($territoryEvaluations as $evaluation)<tr>
            <td>{{ $evaluation->covered ? 'Yes' : 'No' }}</td>
            <td>{{ $evaluation->branch_public_id ?: '—' }}</td>
            <td>{{ $evaluation->road_distance_metres !== null ? number_format($evaluation->road_distance_metres/1000,1).' km' : 'Unavailable' }}</td>
            <td>{{ $evaluation->duration_seconds !== null ? max(1,round($evaluation->duration_seconds/60)).' min' : 'Unavailable' }}</td>
            <td>{{ str((string)$evaluation->result_basis)->replace('_',' ')->title() }}</td>
            <td>@foreach($evaluation->signals as $signal)<span class="badge bg-secondary me-1">{{ str($signal->signal_type)->replace('_',' ')->title() }}</span>@endforeach</td>
            <td>{{ $evaluation->evaluated_at?->format('Y-m-d H:i') ?? '—' }}</td>
        </tr>@endforeach</tbody>
    </table></div>
</div>
@endif
@endif

@if(in_array($page,['territories.service-areas','territories.travel-zones'],true) && $serviceTerritories->isNotEmpty())
<div class="card mb-5">
    <div class="card-header"><h3 class="card-title mb-0">Territory definitions</h3></div>
    <div class="table-responsive"><table class="table table-vcenter card-table">
        <thead><tr><th>Name</th><th>Effect</th><th>Rule</th><th>Branch</th><th>Priority</th><th>Coverage / threshold</th><th>Pricing hint</th><th>Status</th></tr></thead>
        <tbody>@foreach($serviceTerritories as $territory)
            @if(($page === 'territories.travel-zones') === in_array($territory->match_mode,['road_distance','drive_time'],true))
            <tr><td>{{ $territory->name }}</td><td>{{ str($territory->effect)->title() }}</td><td>{{ str($territory->match_mode)->replace('_',' ')->title() }}</td><td>{{ $territory->branch_public_id ?: '—' }}</td><td>{{ $territory->priority }}</td>
                <td>@if($territory->match_mode==='circle'){{ number_format((float)$territory->radius_metres) }} m radius @elseif($territory->match_mode==='polygon'){{ count((array)$territory->geometry) }} points @elseif(in_array($territory->match_mode,['postcode','suburb'],true)){{ implode(', ',(array)$territory->locality_values) }} @elseif($territory->match_mode==='road_distance'){{ number_format(((int)$territory->maximum_road_distance_metres)/1000,1) }} km road @else{{ max(1,round(((int)$territory->maximum_drive_time_seconds)/60)) }} min drive @endif</td>
                <td>@if($territory->pricing_hint){{ str($territory->pricing_hint['type']??'')->title() }} {{ $territory->pricing_hint['value']??'' }} {{ $territory->pricing_hint['currency']??'' }} <span class="text-muted">(advisory)</span>@else—@endif</td>
                <td>{{ str($territory->status)->title() }}</td></tr>
            @endif
        @endforeach</tbody>
    </table></div>
</div>
@endif

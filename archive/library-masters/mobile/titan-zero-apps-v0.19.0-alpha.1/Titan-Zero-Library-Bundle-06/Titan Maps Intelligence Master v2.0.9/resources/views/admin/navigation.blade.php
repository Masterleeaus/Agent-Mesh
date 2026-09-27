@extends('panel.layout.app')

@section('content')
<div class="container-fluid py-6" data-titan-maps-admin-navigation="{{ $page }}">
    <div class="mb-5"><h1 class="mb-2">{{ $title }}</h1><p class="text-muted mb-0">Titan Maps Intelligence platform administration.</p></div>
    <div class="row g-3 mb-5">
        <div class="col-md-4"><div class="card"><div class="card-body"><div class="text-muted">Provider connections</div><div class="fs-2 fw-bold">{{ $providerCount }}</div></div></div></div>
        <div class="col-md-4"><div class="card"><div class="card-body"><div class="text-muted">Enabled connections</div><div class="fs-2 fw-bold">{{ $enabledProviderCount }}</div></div></div></div>
        <div class="col-md-4"><div class="card"><div class="card-body"><div class="text-muted">Usage records</div><div class="fs-2 fw-bold">{{ $usageCount }}</div></div></div></div>
    </div>
    @if ($page === 'providers')
        <div class="card"><div class="table-responsive"><table class="table card-table"><thead><tr><th>Company</th><th>Provider</th><th>Enabled</th><th>Validated</th></tr></thead><tbody>
        @foreach ($providers as $provider)<tr><td>{{ $provider->company_id }}</td><td>{{ $provider->provider }}</td><td>{{ $provider->enabled ? 'Yes' : 'No' }}</td><td>{{ $provider->last_validated_at?->format('Y-m-d H:i') ?? '—' }}</td></tr>@endforeach
        </tbody></table></div></div>
    @elseif ($page === 'usage')
        <div class="card"><div class="table-responsive"><table class="table card-table"><thead><tr><th>Company</th><th>Provider</th><th>Operation</th><th>Requests</th><th>Recorded</th></tr></thead><tbody>
        @foreach ($usage as $record)<tr><td>{{ $record->company_id }}</td><td>{{ $record->provider }}</td><td>{{ $record->operation }}</td><td>{{ $record->request_count }}</td><td>{{ $record->recorded_at?->format('Y-m-d H:i') ?? '—' }}</td></tr>@endforeach
        </tbody></table></div></div>
    @elseif ($page === 'diagnostics')
        <div class="card"><div class="card-body"><p class="mb-0">Installer, provider, migration, tenancy and configuration diagnostics are packaged with this extension. Runtime provider-health probes will be expanded in later passes.</p></div></div>
    @else
        <div class="card"><div class="card-body"><p class="mb-0">Use the Maps administration links for provider health, API usage and diagnostics.</p></div></div>
    @endif
</div>
@endsection

@extends('panel.layout.app')
@section('title', $title)
@section('content')
<div class="page-body">
    <div class="container-xl py-4">
        <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
            <div>
                <h1 class="mb-1">{{ $title }}</h1>
                <p class="text-muted mb-0">{{ $description }}</p>
            </div>
            <a class="btn btn-outline-secondary" href="{{ route('dashboard.user.titan.interface.runtime.index') }}">Overview</a>
        </div>

        <div class="d-flex flex-wrap gap-2 mb-4">
            @foreach([
                'explore'=>'Explore','commands'=>'Command Surface','continue'=>'Continue','attention'=>'Attention',
                'approvals'=>'Approvals','inbox'=>'Inbox','sync'=>'Sync','workspaces'=>'Object Workspaces','collections'=>'Collections',
                'spatial'=>'Spatial','decisions'=>'Decisions','governance'=>'Governance','working-sets'=>'Working Sets',
                'configuration'=>'Configuration','experience'=>'Experience','surfaces'=>'Product Surfaces'
            ] as $key=>$label)
                <a class="btn btn-sm {{ $page === $key ? 'btn-primary' : 'btn-outline-primary' }}"
                   href="{{ route('dashboard.user.titan.interface.runtime.menu.page', $key) }}">{{ $label }}</a>
            @endforeach
        </div>

        @if($page === 'commands')
            <div class="card mb-4"><div class="card-body">
                <form method="GET" class="d-flex gap-2">
                    <input class="form-control" type="search" name="q" value="{{ request('q','') }}" maxlength="200" placeholder="Search Titan interface commands…">
                    <button class="btn btn-primary" type="submit">Search</button>
                </form>
            </div></div>
            <div class="row g-3">
                @forelse(($payload['items'] ?? []) as $item)
                    <div class="col-12 col-lg-6"><div class="card h-100"><div class="card-body">
                        <div class="d-flex justify-content-between gap-3"><strong>{{ $item['label'] ?? 'Command' }}</strong><span class="badge text-bg-light">{{ $item['kind'] ?? 'intent' }}</span></div>
                        <p class="text-muted small mt-2 mb-2">{{ $item['description'] ?? '' }}</p>
                        <div class="small text-muted">Execution: delegated only</div>
                    </div></div></div>
                @empty
                    <div class="col-12"><div class="card"><div class="card-body text-muted">No commands matched.</div></div></div>
                @endforelse
            </div>
        @elseif(in_array($page,['continue','attention','approvals','inbox'],true))
            <div class="row g-3">
                @forelse(($payload['items'] ?? []) as $item)
                    <div class="col-12 col-lg-6"><div class="card h-100"><div class="card-body">
                        <div class="d-flex justify-content-between gap-3"><strong>{{ $item['label'] ?? 'Work item' }}</strong><span class="badge text-bg-light">P{{ $item['priority'] ?? 0 }}</span></div>
                        @if(!empty($item['summary']))<p class="text-muted small mt-2 mb-2">{{ $item['summary'] }}</p>@endif
                        <div class="small text-muted">{{ $item['source_authority'] ?? 'source' }} · {{ $item['source_reference'] ?? '' }}</div>
                    </div></div></div>
                @empty
                    <div class="col-12"><div class="card"><div class="card-body text-muted">Nothing in this tray right now.</div></div></div>
                @endforelse
            </div>
        @elseif($page === 'sync')
            <div class="row g-3 mb-4">
                @foreach([['Overall',$payload['overall_state'] ?? 'unknown'],['Network',$payload['network_state'] ?? 'unknown'],['Source tray',$payload['source_tray_status'] ?? 'unknown']] as $metric)
                    <div class="col-12 col-md-4"><div class="card h-100"><div class="card-body"><div class="text-muted small">{{ $metric[0] }}</div><div class="fs-3 fw-semibold">{{ str_replace('-',' ',ucfirst($metric[1])) }}</div></div></div></div>
                @endforeach
            </div>
            <div class="card mb-4"><div class="card-header"><strong>Sync items</strong></div><div class="list-group list-group-flush">
                @forelse(($payload['items'] ?? []) as $item)
                    <div class="list-group-item"><div class="d-flex justify-content-between gap-3"><strong>{{ $item['label'] ?? 'Sync item' }}</strong><span class="badge text-bg-light">{{ $item['state'] ?? 'unknown' }}</span></div><div class="small text-muted mt-1">{{ $item['summary'] ?? ($item['source_reference'] ?? '') }}</div></div>
                @empty<div class="list-group-item text-muted">No sync items.</div>@endforelse
            </div></div>
            @if(!empty($payload['conflicts']))<div class="card"><div class="card-header"><strong>Conflicts</strong></div><div class="list-group list-group-flush">@foreach($payload['conflicts'] as $conflict)<div class="list-group-item"><strong>{{ $conflict['kind'] ?? 'Conflict' }}</strong><div class="small text-muted">{{ $conflict['summary'] ?? '' }}</div></div>@endforeach</div></div>@endif
        @elseif($page === 'explore')
            <div class="row g-3">
                @foreach(['domains'=>'Domains','objects'=>'Objects','views'=>'Views','actions'=>'Actions'] as $key=>$label)
                    <div class="col-12 col-lg-6"><div class="card h-100"><div class="card-header"><strong>{{ $label }}</strong></div><div class="card-body"><pre class="mb-0 small overflow-auto" style="max-height:420px">{{ json_encode($payload[$key] ?? [], JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES) }}</pre></div></div></div>
                @endforeach
            </div>
        @elseif(in_array($page,['workspaces','collections','spatial','decisions','governance','working-sets','configuration'],true))
            <div class="alert alert-info" role="status">{{ $payload['note'] ?? '' }}</div>
            <div class="row g-3">
                @foreach(['objects'=>'Available objects','views'=>'Contributed views','actions'=>'Registered actions'] as $key=>$label)
                    <div class="col-12 col-xl-4"><div class="card h-100"><div class="card-header"><strong>{{ $label }}</strong></div><div class="card-body"><pre class="mb-0 small overflow-auto" style="max-height:520px">{{ json_encode($payload[$key] ?? [], JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES) }}</pre></div></div></div>
                @endforeach
            </div>
        @else
            <div class="card"><div class="card-body"><pre class="mb-0 small overflow-auto" style="max-height:70vh">{{ json_encode($payload, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES) }}</pre></div></div>
        @endif
    </div>
</div>
@endsection

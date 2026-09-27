@extends('panel.layout.app')
@section('title', 'Titan Interface Runtime')
@section('content')
<div class="page-body">
    <div class="container-xl py-4">
        <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
            <div>
                <div class="text-muted small mb-1">Titan platform presentation authority</div>
                <h1 class="mb-1">{{ __('Titan Interface Runtime') }}</h1>
                <p class="text-muted mb-0">{{ __('One governed presentation layer for Command, Go, Hub and Onboarding. Business data, decisions and mutations remain owned by their source extensions.') }}</p>
            </div>
            <div class="d-flex flex-wrap gap-2">
                <span class="badge text-bg-light">v{{ $health['version'] ?? '1.0.3' }}</span>
                <span class="badge {{ ($health['status'] ?? '') === 'HEALTHY' ? 'text-bg-success' : 'text-bg-warning' }}">{{ $health['status'] ?? 'UNKNOWN' }}</span>
            </div>
        </div>

        <div class="row g-3 mb-4">
            @foreach([
                ['explore','Explore','Registered domains, objects, views and actions'],
                ['commands','Command Surface','Search navigation and governed action intents'],
                ['continue','Continue','Resume work contributed by Titan extensions'],
                ['attention','Attention','Issues that currently need attention'],
                ['approvals','Approvals','Governed approvals waiting for action'],
                ['inbox','Inbox','Cross-extension inbox references'],
                ['sync','Sync','Offline, queue and conflict state'],
                ['workspaces','Object Workspaces','Facet-driven cross-extension object workspaces'],
                ['collections','Collections','Cards, table, board, calendar, timeline and feed'],
                ['spatial','Spatial','Maps, routes, candidates and territories'],
                ['decisions','Decisions','Observations, recommendations and scenarios'],
                ['governance','Governance','Risk, assurance, approval, receipts and rollback'],
                ['working-sets','Working Sets','Mixed-object context for humans and Zero'],
                ['configuration','Configuration','Draft, preview, validate, publish and rollback'],
                ['experience','Experience','Focus, Attention HUD and guidance'],
                ['surfaces','Product Surfaces','Command, Go, Hub and Onboarding policy'],
            ] as [$slug,$label,$summary])
                <div class="col-12 col-md-6 col-xl-4">
                    <a class="card h-100 text-decoration-none" href="{{ route('dashboard.user.titan.interface.runtime.menu.page', $slug) }}">
                        <div class="card-body">
                            <div class="d-flex align-items-start justify-content-between gap-3">
                                <div>
                                    <h3 class="h4 mb-1 text-body">{{ __($label) }}</h3>
                                    <p class="text-muted small mb-0">{{ __($summary) }}</p>
                                </div>
                                <span class="text-muted" aria-hidden="true">→</span>
                            </div>
                        </div>
                    </a>
                </div>
            @endforeach
        </div>

        <div class="row g-3 mb-4">
            <div class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header"><h2 class="card-title mb-0">{{ __('Current interface context') }}</h2></div>
                    <div class="card-body">
                        <dl class="row mb-0 small">
                            @foreach ($context as $key => $value)
                                <dt class="col-5 text-muted">{{ $key }}</dt>
                                <dd class="col-7 text-end text-break">{{ is_bool($value) ? ($value ? 'true' : 'false') : (is_scalar($value) || $value === null ? $value : json_encode($value)) }}</dd>
                            @endforeach
                        </dl>
                    </div>
                </div>
            </div>
            <div class="col-12 col-xl-6">
                <div class="card h-100">
                    <div class="card-header"><h2 class="card-title mb-0">{{ __('Authority boundaries') }}</h2></div>
                    <div class="card-body">
                        <dl class="row mb-0 small">
                            @foreach ($boundaries as $key => $value)
                                <dt class="col-6 text-muted">{{ $key }}</dt>
                                <dd class="col-6 text-end text-break">{{ is_bool($value) ? ($value ? 'true' : 'false') : (is_scalar($value) || $value === null ? $value : json_encode($value)) }}</dd>
                            @endforeach
                        </dl>
                    </div>
                </div>
            </div>
        </div>

        <div class="card mb-4">
            <div class="card-header"><h2 class="card-title mb-0">{{ __('Registry-derived navigation') }}</h2></div>
            <div class="card-body">
                <div class="row g-3">
                    @forelse (($navigation['items'] ?? []) as $domain)
                        <div class="col-12 col-lg-6">
                            <div class="border rounded p-3 h-100">
                                <div class="d-flex align-items-center justify-content-between gap-3">
                                    <strong>{{ $domain['label'] }}</strong>
                                    <span class="badge text-bg-light">{{ $domain['layer'] }}</span>
                                </div>
                                <div class="d-flex flex-wrap gap-2 mt-3">
                                    @foreach (($domain['intent_surfaces'] ?? []) as $surface)
                                        <span class="badge {{ !empty($surface['active']) ? 'text-bg-primary' : 'text-bg-light' }}">{{ $surface['label'] }}</span>
                                    @endforeach
                                </div>
                            </div>
                        </div>
                    @empty
                        <div class="col-12"><div class="text-muted">{{ __('No domains are visible for this product surface.') }}</div></div>
                    @endforelse
                </div>
            </div>
        </div>

        <div class="row g-3">
            @foreach([
                'Domain registry'=>$domainRegistry,
                'Object & relationship registry'=>$objectRegistry,
                'Facet registry & workspace'=>$facetRegistry,
                'View registry'=>$viewRegistry,
                'Legacy Data surfaces'=>$legacyDataRegistry,
                'Global Work trays'=>$globalWorkRegistry,
                'Action registry'=>$actionRegistry,
                'Runtime health'=>$health,
            ] as $label=>$payload)
                <div class="col-12 col-xl-6">
                    <div class="card h-100">
                        <div class="card-header"><h2 class="card-title mb-0">{{ __($label) }}</h2></div>
                        <div class="card-body"><pre class="mb-0 small overflow-auto" style="max-height:360px">{{ json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) }}</pre></div>
                    </div>
                </div>
            @endforeach
        </div>
    </div>
</div>
@endsection

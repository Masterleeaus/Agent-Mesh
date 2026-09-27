@extends('titan-builder::management.layout')
@section('topbar-actions')
<a class="tbm-button is-primary" href="{{ route('titan-builder.manage.applications') }}">Manage apps</a>
@endsection
@section('content')
<div class="tbm-stat-grid">
@foreach($summary['counts'] as $label => $count)
    <article class="tbm-stat"><span>{{ ucwords(str_replace('_',' ',$label)) }}</span><strong>{{ $count }}</strong></article>
@endforeach
</div>
<section class="tbm-section">
    <div class="tbm-section-head"><div><p class="tbm-eyebrow">Four-PWA provisioning</p><h2>Applications</h2></div><a href="{{ route('titan-builder.manage.applications') }}">Open provisioning →</a></div>
    <div class="tbm-card-grid">
        @php($products=['customer'=>'Titan Hub','field'=>'Titan Go','owner'=>'Titan Command','onboarding'=>'Titan Onboarding'])
        @foreach($products as $surface=>$product)
            @php($app=collect($summary['applications'])->first(fn($item)=>($item['surface'] ?? null)===$surface))
            <a class="tbm-card tbm-app-card" href="{{ route('titan-builder.manage.application',$surface) }}">
                <div class="tbm-product-icon">{{ substr(str_replace('Titan ','',$product),0,1) }}</div>
                <div><strong>{{ $product }}</strong><span>{{ ucfirst($surface) }} surface</span><small>{{ $app ? 'Configured' : 'Not provisioned' }}</small></div>
            </a>
        @endforeach
    </div>
</section>
<section class="tbm-grid-2">
    <article class="tbm-panel"><p class="tbm-eyebrow">Capabilities</p><h2>Connected platform</h2><p>{{ count($summary['capabilities']) }} machine-readable capabilities are currently visible to this company.</p><a href="{{ route('titan-builder.manage.integrations') }}">Review integrations →</a></article>
    <article class="tbm-panel"><p class="tbm-eyebrow">Authoring defaults</p><h2>{{ ucfirst($summary['settings']['preview_device']) }} preview</h2><p>Default surface: {{ ucfirst($summary['settings']['default_surface']) }} · Network: {{ $summary['settings']['preview_network_state'] }}</p><a href="{{ route('titan-builder.manage.settings') }}">Change settings →</a></article>
</section>
@endsection

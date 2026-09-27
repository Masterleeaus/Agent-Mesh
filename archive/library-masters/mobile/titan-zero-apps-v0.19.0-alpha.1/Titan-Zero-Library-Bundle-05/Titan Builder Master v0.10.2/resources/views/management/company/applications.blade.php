@extends('titan-builder::management.layout')
@section('topbar-actions')
<button class="tbm-button is-primary" type="button" data-tbm-provision-set data-endpoint="{{ route('titan-builder.applications.provision') }}">Provision missing apps</button>
@endsection
@section('content')
@php($products=['customer'=>['Titan Hub','Customer PWA'],'field'=>['Titan Go','Field-worker PWA'],'owner'=>['Titan Command','Owner/manager PWA'],'onboarding'=>['Titan Onboarding','Business setup PWA']])
<div class="tbm-card-grid is-applications">
@foreach($products as $surface=>$meta)
    @php($app=collect($applications)->first(fn($item)=>($item['surface'] ?? null)===$surface); $ready=$readiness[$surface] ?? ['status'=>'blocked','reasons'=>[]])
    <a class="tbm-panel tbm-app-overview" href="{{ route('titan-builder.manage.application',$surface) }}">
        <div class="tbm-card-top"><div class="tbm-product-icon">{{ substr(str_replace('Titan ','',$meta[0]),0,1) }}</div>@include('titan-builder::management.partials.status',['status'=>$ready['status'] ?? 'blocked'])</div>
        <h2>{{ $meta[0] }}</h2><p>{{ $meta[1] }}</p>
        <dl><div><dt>State</dt><dd>{{ $app ? 'Configured' : 'Not provisioned' }}</dd></div><div><dt>Version</dt><dd>{{ $app['version'] ?? 'Draft' }}</dd></div></dl>
    </a>
@endforeach
</div>
@endsection

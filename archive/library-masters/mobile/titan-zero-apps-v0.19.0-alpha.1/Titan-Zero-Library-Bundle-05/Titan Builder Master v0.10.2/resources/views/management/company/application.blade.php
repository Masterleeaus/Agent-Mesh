@extends('titan-builder::management.layout')
@section('topbar-actions')
@if($application === null)
<button class="tbm-button is-primary" type="button" data-tbm-app-action data-method="POST" data-endpoint="{{ route('titan-builder.applications.create',$surface) }}" data-reload="true">Create {{ ['customer'=>'Titan Hub','field'=>'Titan Go','owner'=>'Titan Command','onboarding'=>'Titan Onboarding'][$surface] }}</button>
@else
<button class="tbm-button" type="button" data-tbm-app-action data-method="POST" data-endpoint="{{ route('titan-builder.applications.validate',$surface) }}">Validate</button>
<button class="tbm-button is-primary" type="button" data-tbm-app-action data-method="POST" data-endpoint="{{ route('titan-builder.applications.publish',$surface) }}">Publish</button>
@endif
@endsection
@section('content')
@php($product=['customer'=>'Titan Hub','field'=>'Titan Go','owner'=>'Titan Command','onboarding'=>'Titan Onboarding'][$surface])
<section class="tbm-section-head"><div><p class="tbm-eyebrow">{{ ucfirst($surface) }} surface</p><h2>{{ $product }}</h2></div>@include('titan-builder::management.partials.status',['status'=>$readiness['status'] ?? 'blocked'])</section>
@if(!empty($readiness['reasons']))<div class="tbm-panel"><h3>Readiness</h3><ul class="tbm-reasons">@foreach($readiness['reasons'] as $reason)<li><strong>{{ $reason['code'] ?? 'check' }}</strong> {{ $reason['message'] ?? '' }}</li>@endforeach</ul></div>@endif
<div class="tbm-settings-grid" data-tbm-application-editor data-surface="{{ $surface }}">
    @foreach([
        'identity'=>['Identity', route('titan-builder.applications.identity',$surface), $application['identity'] ?? []],
        'brand'=>['Brand override', route('titan-builder.applications.brand',$surface), $application['brand'] ?? []],
        'navigation'=>['Navigation', route('titan-builder.applications.navigation',$surface), $application['navigation'] ?? []],
        'features'=>['Features', route('titan-builder.applications.features',$surface), $application['features'] ?? []],
        'assistant'=>['Assistant presentation', route('titan-builder.applications.assistant',$surface), $application['assistant'] ?? []],
        'privacy'=>['Privacy', route('titan-builder.applications.privacy',$surface), $application['privacy'] ?? []],
        'notifications'=>['Notifications', route('titan-builder.applications.notifications',$surface), $application['notifications'] ?? []],
        'offline'=>['Offline policy', route('titan-builder.applications.offline',$surface), $application['offline'] ?? []],
    ] as $key=>$item)
        <form class="tbm-panel tbm-json-settings" data-tbm-nested-json-form data-key="{{ $key }}" data-endpoint="{{ $item[1] }}" data-method="PATCH">
            <h3>{{ $item[0] }}</h3><textarea name="json" class="tbm-code is-small">{{ json_encode($item[2], JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES) }}</textarea><button class="tbm-button is-small" type="submit">Save {{ strtolower($item[0]) }}</button>
        </form>
    @endforeach
    <form class="tbm-panel" data-tbm-json-form data-endpoint="{{ route('titan-builder.applications.theme',$surface) }}" data-method="PATCH"><h3>Theme</h3><label>Theme ID<input name="theme" value="{{ $application['theme'] ?? 'titan-light' }}"></label><button class="tbm-button is-small" type="submit">Save theme</button></form>
    <form class="tbm-panel" data-tbm-json-form data-endpoint="{{ route('titan-builder.applications.vertical',$surface) }}" data-method="POST"><h3>Vertical pack</h3><label>Vertical slug<input name="vertical" value="{{ $application['vertical'] ?? '' }}" placeholder="plumbing"></label><button class="tbm-button is-small" type="submit">Apply vertical</button></form>
</div>
<section class="tbm-panel"><h3>Preview application</h3><div class="tbm-inline-form"><select id="tbm-app-preview-device"><option>mobile</option><option>tablet</option><option>desktop</option></select><select id="tbm-app-preview-state"><option>online</option><option>offline</option><option>syncing</option><option>conflict</option><option>empty</option><option>populated</option><option>loading</option><option>error</option><option>permission-denied</option></select><button class="tbm-button" type="button" data-tbm-app-preview data-endpoint="{{ route('titan-builder.applications.preview',$surface) }}">Generate preview</button></div><pre id="tbm-app-preview-output" class="tbm-output" hidden></pre></section>
@endsection

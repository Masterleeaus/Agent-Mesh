@extends('titan-builder::management.layout')
@section('content')
<div class="tbm-panel"><p class="tbm-eyebrow">Platform capability discovery</p><h2>Detected capabilities</h2><p>These are machine-readable capabilities exposed by the host platform. Titan Builder does not store integration secrets.</p><div class="tbm-code-list">@forelse($capabilities as $capability)<code>{{ $capability }}</code>@empty<span>No external capabilities discovered.</span>@endforelse</div></div>
@endsection

@extends('titan-builder::management.layout')
@section('content')
<div class="tbm-panel"><p class="tbm-eyebrow">Host-authorized</p><h2>Your Builder capabilities</h2><p>Titan Builder reads these abilities from the authenticated host actor. This page does not grant permissions.</p><div class="tbm-permission-list">@foreach($grants as $ability=>$granted)<div><code>{{ $ability }}</code>@include('titan-builder::management.partials.status',['status'=>$granted?'ready':'blocked'])</div>@endforeach</div></div>
@endsection

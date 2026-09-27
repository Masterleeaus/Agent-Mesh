@extends('titan-builder::management.layout')
@section('content')
<div class="tbm-panel"><p class="tbm-eyebrow">Host permission catalogue</p><h2>Titan Builder abilities</h2><p>Roles and permission assignments remain owned by the host authorization system. Titan Builder only checks these explicit abilities.</p><div class="tbm-permission-list">@foreach($abilities as $ability=>$description)<div><code>{{ $ability }}</code><span>{{ $description }}</span></div>@endforeach</div></div>
@endsection

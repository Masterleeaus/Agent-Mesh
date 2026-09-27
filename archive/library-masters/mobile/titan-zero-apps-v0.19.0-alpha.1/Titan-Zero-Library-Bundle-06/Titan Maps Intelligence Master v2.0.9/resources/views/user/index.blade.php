@extends('panel.layout.app')

@section('content')
<div class="container-fluid py-6" data-titan-maps-user-dashboard>
    <h1>Titan Maps Intelligence</h1>
    <p class="text-muted">Company-scoped discovery and geographic intelligence.</p>
    <x-titan-maps-intelligence::search-composer />
</div>
@endsection

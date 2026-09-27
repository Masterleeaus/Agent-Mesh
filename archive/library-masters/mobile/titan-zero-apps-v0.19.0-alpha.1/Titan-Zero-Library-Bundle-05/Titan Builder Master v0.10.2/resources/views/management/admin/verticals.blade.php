@extends('titan-builder::management.layout')
@section('content')
<div class="tbm-card-grid is-verticals">@foreach($verticals as $vertical)<article class="tbm-panel"><p class="tbm-eyebrow">{{ $vertical['slug'] ?? $vertical['id'] ?? 'vertical' }}</p><h2>{{ $vertical['name'] ?? ucwords(str_replace('-',' ',$vertical['slug'] ?? 'Vertical')) }}</h2><p>{{ $vertical['description'] ?? 'Presentation configuration pack.' }}</p><details class="tbm-details"><summary>Contract</summary><pre>{{ json_encode($vertical,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES) }}</pre></details></article>@endforeach</div>
@endsection

@extends('titan-builder::management.layout')
@section('content')
<div class="tbm-registry-tabs" data-tbm-tabs>
    @foreach(['components','blocks','templates','themes','surfaces','data_sources','actions','specs'] as $collection)<button type="button" data-tab="{{ $collection }}">{{ ucwords(str_replace('_',' ',$collection)) }} <span>{{ count($catalogue[$collection] ?? []) }}</span></button>@endforeach
</div>
@foreach(['components','blocks','templates','themes','surfaces','data_sources','actions','specs'] as $collection)
<section class="tbm-registry-panel" data-panel="{{ $collection }}" @if($collection!=='components') hidden @endif><div class="tbm-list">@foreach($catalogue[$collection] ?? [] as $item)<details class="tbm-registry-item"><summary><strong>{{ $item['name'] ?? $item['id'] ?? 'Definition' }}</strong><code>{{ $item['id'] ?? $item['slug'] ?? '' }}</code></summary><pre>{{ json_encode($item, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES) }}</pre></details>@endforeach</div></section>
@endforeach
@endsection

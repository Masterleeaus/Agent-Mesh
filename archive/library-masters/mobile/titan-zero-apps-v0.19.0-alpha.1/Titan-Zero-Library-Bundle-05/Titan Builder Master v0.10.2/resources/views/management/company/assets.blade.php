@extends('titan-builder::management.layout')
@section('content')
<section class="tbm-grid-2 tbm-align-start">
<form class="tbm-panel" data-tbm-asset-form data-endpoint-template="{{ url(config('titan-builder.route_prefix','titan-builder/api').'/projects/__PROJECT__/assets') }}">
    <p class="tbm-eyebrow">Company-scoped</p><h2>Upload asset</h2>
    <label>Project<select name="project" required>@foreach($projects as $project)<option value="{{ $project->getKey() }}">{{ $project->name }}</option>@endforeach</select></label>
    <label>File<input name="file" type="file" required accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"></label>
    <button class="tbm-button is-primary" type="submit">Upload</button>
</form>
<div><div class="tbm-section-head"><div><p class="tbm-eyebrow">Library</p><h2>Assets</h2></div><span>{{ $assets->count() }} shown</span></div><div class="tbm-list">@forelse($assets as $asset)<div class="tbm-list-row"><div><strong>{{ $asset->original_name ?? ('Asset #'.$asset->getKey()) }}</strong><span>asset://{{ $asset->getKey() }}</span></div><div class="tbm-row-meta"><span>{{ $asset->mime_type ?? '' }}</span><span>Project #{{ $asset->project_id }}</span></div></div>@empty<div class="tbm-empty"><strong>No uploaded assets</strong></div>@endforelse</div></div>
</section>
@endsection

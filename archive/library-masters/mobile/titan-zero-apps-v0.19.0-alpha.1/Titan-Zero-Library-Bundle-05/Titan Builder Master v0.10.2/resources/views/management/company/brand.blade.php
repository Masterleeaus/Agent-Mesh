@extends('titan-builder::management.layout')
@section('content')
<section class="tbm-grid-2 tbm-align-start">
<form class="tbm-panel" data-tbm-brand-form data-endpoint="{{ route('titan-builder.applications.shared-brand') }}">
    <p class="tbm-eyebrow">Shared company identity</p><h2>Brand all four apps</h2>
    <div class="tbm-form-grid"><label>Primary colour<input type="color" name="primary_colour" value="#12304a"></label><label>Secondary colour<input type="color" name="secondary_colour" value="#f28c28"></label><label>Accent colour<input type="color" name="accent_colour" value="#36c98f"></label></div>
    <label>Logo asset reference<input name="logo" placeholder="asset://123"></label><label>Icon asset reference<input name="icon" placeholder="asset://124"></label>
    <label>Theme preference<select name="light_dark_preference"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
    <button class="tbm-button is-primary" type="submit">Apply brand to all apps</button>
</form>
<div><div class="tbm-section-head"><div><p class="tbm-eyebrow">Themes</p><h2>Available themes</h2></div></div><div class="tbm-card-grid">@foreach($packagedThemes as $theme)<article class="tbm-card"><strong>{{ $theme['name'] ?? $theme['id'] ?? 'Theme' }}</strong><span>{{ $theme['id'] ?? '' }}</span></article>@endforeach @foreach($themes as $theme)<article class="tbm-card"><strong>{{ $theme->name ?? 'Company theme' }}</strong><span>Company theme</span></article>@endforeach</div></div>
</section>
@endsection

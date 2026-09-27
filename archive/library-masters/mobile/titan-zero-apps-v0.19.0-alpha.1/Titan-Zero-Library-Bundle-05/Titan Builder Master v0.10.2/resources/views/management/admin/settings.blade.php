@extends('titan-builder::management.layout')
@section('content')
<form class="tbm-panel tbm-settings-form" method="post" action="{{ route('titan-builder.admin.settings.update') }}">@csrf @method('PATCH')
<p class="tbm-eyebrow">Global Builder presentation</p><h2>Platform settings</h2>
<div class="tbm-form-grid"><label>Default preview device<select name="default_preview_device">@foreach(['mobile','tablet','desktop'] as $value)<option @selected($settings['default_preview_device']===$value)>{{ $value }}</option>@endforeach</select></label><label>Diagnostics level<select name="diagnostics_level">@foreach(['minimal','standard','verbose'] as $value)<option @selected($settings['diagnostics_level']===$value)>{{ $value }}</option>@endforeach</select></label></div>
<div class="tbm-toggle-grid">@foreach(['management_ui_enabled'=>'Management UI enabled','ai_generation_enabled'=>'TitanAI generation UI enabled','asset_uploads_enabled'=>'Asset uploads enabled','premium_mobile_enabled'=>'Premium Mobilekit presentation enabled','show_experimental_resources'=>'Show experimental registry resources'] as $key=>$label)<label class="tbm-toggle"><input type="checkbox" name="{{ $key }}" value="1" @checked($settings[$key])><span></span>{{ $label }}</label>@endforeach</div>
<button class="tbm-button is-primary" type="submit">Save platform settings</button>
</form>
@endsection

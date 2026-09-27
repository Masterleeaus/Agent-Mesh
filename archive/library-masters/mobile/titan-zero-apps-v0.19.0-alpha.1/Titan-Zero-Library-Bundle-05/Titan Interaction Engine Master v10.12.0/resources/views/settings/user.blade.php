<div style="max-width:1000px;margin:24px auto;padding:0 20px;font-family:system-ui,-apple-system,sans-serif;color:#111827">
    <h1 style="margin-bottom:4px">Interaction settings</h1><p style="color:#6b7280;margin-top:0">Company {{ $companyId }}</p>
    @if(session('status'))<div style="padding:12px 14px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;margin-bottom:16px">{{ session('status') }}</div>@endif
    <section style="padding:20px;border:1px solid #e5e7eb;border-radius:14px;margin-bottom:18px"><h2>Your preferences</h2>
        <form method="post" action="{{ route('dashboard.user.interaction-engine.settings.preferences.update') }}">@csrf
            <label>Interaction style <select name="interaction_style">@foreach(['inherit'=>'Use company default','hybrid'=>'Hybrid','conversational'=>'Conversational','structured'=>'Structured'] as $v=>$label)<option value="{{ $v }}" @selected($userSettings['interaction_style']===$v)>{{ $label }}</option>@endforeach</select></label><br><br>
            <label>Guidance detail <select name="guidance_detail">@foreach(['concise','balanced','detailed'] as $v)<option value="{{ $v }}" @selected($userSettings['guidance_detail']===$v)>{{ ucfirst($v) }}</option>@endforeach</select></label><br><br>
            <label><input type="hidden" name="local_guidance_enabled" value="0"><input type="checkbox" name="local_guidance_enabled" value="1" @checked($userSettings['local_guidance_enabled'])> Local guidance</label><br><br>
            <label>Offline preference <select name="offline_preference">@foreach(['inherit'=>'Use company default','auto'=>'Automatic','offline_first'=>'Offline first','online_first'=>'Online first'] as $v=>$label)<option value="{{ $v }}" @selected($userSettings['offline_preference']===$v)>{{ $label }}</option>@endforeach</select></label><br><br>
            <label><input type="hidden" name="show_progress" value="0"><input type="checkbox" name="show_progress" value="1" @checked($userSettings['show_progress'])> Show wizard progress</label><br><br>
            <button type="submit">Save my preferences</button>
        </form>
    </section>
    @if($canManageCompany)
    <section style="padding:20px;border:1px solid #e5e7eb;border-radius:14px;margin-bottom:18px"><h2>Company Interaction defaults</h2>
        <form method="post" action="{{ route('dashboard.user.interaction-engine.settings.company.update') }}">@csrf
            <label>Default renderer <select name="default_renderer">@foreach(['hybrid','conversational','structured'] as $v)<option value="{{ $v }}" @selected($companySettings['default_renderer']===$v)>{{ ucfirst($v) }}</option>@endforeach</select></label><br><br>
            <label>Interaction style <select name="interaction_style">@foreach(['hybrid','conversational','structured'] as $v)<option value="{{ $v }}" @selected($companySettings['interaction_style']===$v)>{{ ucfirst($v) }}</option>@endforeach</select></label><br><br>
            <label><input type="hidden" name="local_intelligence_enabled" value="0"><input type="checkbox" name="local_intelligence_enabled" value="1" @checked($companySettings['local_intelligence_enabled'])> Allow LocalBrain for this company</label><br><br>
            <label><input type="hidden" name="offline_enabled" value="0"><input type="checkbox" name="offline_enabled" value="1" @checked($companySettings['offline_enabled'])> Allow offline workflow execution</label><br><br>
            <label>Offline behavior <select name="offline_behavior">@foreach(['auto'=>'Automatic','offline_first'=>'Offline first','online_first'=>'Online first'] as $v=>$label)<option value="{{ $v }}" @selected($companySettings['offline_behavior']===$v)>{{ $label }}</option>@endforeach</select></label><br><br>
            <label><input type="hidden" name="show_progress" value="0"><input type="checkbox" name="show_progress" value="1" @checked($companySettings['show_progress'])> Show wizard progress by default</label><br><br>
            <button type="submit">Save company defaults</button>
        </form>
        <p style="color:#6b7280;font-size:13px">AI authority, business services, brand, channels and other domain settings remain governed configuration journeys; they are not direct CRUD settings here.</p>
    </section>
    <section style="padding:20px;border:1px solid #e5e7eb;border-radius:14px"><h2>Configuration journeys</h2><p>These reuse the same Interaction Engine wizard state used by Titan Onboarding.</p><ul>@forelse($journeys as $journey)<li><strong>{{ $journey['name'] }}</strong> <code>{{ $journey['id'] }}</code></li>@empty<li>No onboarding journeys are currently registered.</li>@endforelse</ul></section>
    @endif
</div>

<div style="max-width:1100px;margin:24px auto;padding:0 20px;font-family:system-ui,-apple-system,sans-serif;color:#111827">
    <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:24px">
        <div><h1 style="margin:0;font-size:28px">Titan Interaction Engine</h1><p style="margin:6px 0;color:#6b7280">Super Admin settings · v{{ $version }}</p><p style="margin:8px 0 0"><a href="{{ route('dashboard.admin.interaction-engine.index') }}">Overview</a></p></div>
        <span style="padding:7px 11px;border-radius:999px;background:{{ ($health['status'] ?? '') === 'ready' ? '#dcfce7' : '#fef3c7' }}">{{ strtoupper($health['status'] ?? 'unknown') }}</span>
    </div>
    @if(session('status'))<div style="padding:12px 14px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;margin-bottom:16px">{{ session('status') }}</div>@endif
    <form method="post" action="{{ route('dashboard.admin.interaction-engine.settings.update') }}">@csrf
        <section style="padding:20px;border:1px solid #e5e7eb;border-radius:14px;margin-bottom:18px"><h2>Runtime</h2>
            <label><input type="hidden" name="enabled" value="0"><input type="checkbox" name="enabled" value="1" @checked($settings['enabled'])> Engine enabled</label><br><br>
            <label>Default renderer <select name="default_renderer"><option value="hybrid" @selected($settings['default_renderer']==='hybrid')>Hybrid</option><option value="conversational" @selected($settings['default_renderer']==='conversational')>Conversational</option><option value="structured" @selected($settings['default_renderer']==='structured')>Structured</option></select></label><br><br>
            <label><input type="hidden" name="local_intelligence_enabled" value="0"><input type="checkbox" name="local_intelligence_enabled" value="1" @checked($settings['local_intelligence_enabled'])> LocalBrain enabled</label><br><br>
            <label>LocalBrain minimum confidence <input type="number" min="0" max="1" step="0.01" name="local_minimum_confidence" value="{{ $settings['local_minimum_confidence'] }}"></label><br><br>
            <label><input type="hidden" name="offline_enabled" value="0"><input type="checkbox" name="offline_enabled" value="1" @checked($settings['offline_enabled'])> Offline execution enabled</label>
        </section>
        <section style="padding:20px;border:1px solid #e5e7eb;border-radius:14px;margin-bottom:18px"><h2>Runtime limits</h2>
            <label>Definition cache TTL (seconds) <input type="number" min="60" max="86400" name="cache_ttl" value="{{ $settings['cache_ttl'] }}"></label><br><br>
            <label>Fresh authentication window (seconds) <input type="number" min="60" max="3600" name="fresh_authentication_seconds" value="{{ $settings['fresh_authentication_seconds'] }}"></label><br><br>
            <label>Offline sync batch size <input type="number" min="1" max="500" name="sync_batch_size" value="{{ $settings['sync_batch_size'] }}"></label>
            <p style="color:#6b7280;font-size:13px">Policy/bootstrap changes are applied when the Laravel worker/container is refreshed. Engine enablement is checked dynamically.</p>
        </section>
        <button type="submit" style="padding:10px 16px;border:0;border-radius:9px;background:#111827;color:white;font-weight:600">Save platform settings</button>
    </form>
    <section style="padding:20px;border:1px solid #e5e7eb;border-radius:14px;margin-top:22px"><h2>Security secrets</h2><p>Secret values are never displayed or stored in normal Interaction settings.</p>
        <ul><li>Approval signing secret: <strong>{{ ($secrets['approval_secret']['configured'] ?? false) ? 'Configured' : 'Not configured' }}</strong></li><li>Offline outbox secret: <strong>{{ ($secrets['outbox_secret']['configured'] ?? false) ? 'Configured' : 'Not configured' }}</strong></li></ul>
        @if(!($secrets['approval_secret']['configured'] ?? false))
            <div style="padding:12px 14px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-top:12px"><strong>Approval-required actions are disabled.</strong> Configure <code>INTERACTION_APPROVAL_SECRET</code> with a random value of at least 16 characters, then clear/reload Laravel configuration.</div>
        @endif
        @if(!($secrets['outbox_secret']['configured'] ?? false))
            <div style="padding:12px 14px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-top:12px"><strong>Encrypted offline queueing is disabled.</strong> Configure <code>INTERACTION_OUTBOX_SECRET</code> with a strong random value (16+ characters recommended), then clear/reload Laravel configuration.</div>
        @endif
    </section>
    <section style="padding:20px;border:1px solid #e5e7eb;border-radius:14px;margin-top:18px"><h2>Capability providers</h2><ul>@foreach($providers as $name=>$provider)<li><strong>{{ strtoupper($name) }}</strong>: {{ $provider['supported'] }}/{{ $provider['declared'] }} currently supported</li>@endforeach</ul></section>
    <section style="padding:20px;border:1px solid #e5e7eb;border-radius:14px;margin-top:18px"><h2>Health</h2><ul>@foreach(($health['checks'] ?? []) as $check)<li>{{ $check['name'] }} — {{ $check['status'] }} — {{ $check['detail'] }}</li>@endforeach</ul></section>
</div>

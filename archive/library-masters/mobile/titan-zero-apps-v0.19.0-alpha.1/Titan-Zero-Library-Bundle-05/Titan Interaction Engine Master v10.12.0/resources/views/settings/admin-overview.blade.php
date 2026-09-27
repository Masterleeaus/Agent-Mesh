<div style="max-width:1100px;margin:24px auto;padding:0 20px;font-family:system-ui,-apple-system,sans-serif;color:#111827">
    <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:24px">
        <div><h1 style="margin:0;font-size:28px">Titan Interaction Engine</h1><p style="margin:6px 0;color:#6b7280">Super Admin overview · v{{ $version }}</p></div>
        <span style="padding:7px 11px;border-radius:999px;background:{{ ($health['status'] ?? '') === 'ready' ? '#dcfce7' : '#fef3c7' }}">{{ strtoupper($health['status'] ?? 'unknown') }}</span>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:22px">
        <a href="{{ route('dashboard.admin.interaction-engine.settings') }}" style="padding:10px 14px;border-radius:9px;background:#111827;color:white;text-decoration:none;font-weight:600">Settings</a>
        <a href="{{ route('dashboard.admin.interaction-engine.health') }}" style="padding:10px 14px;border-radius:9px;border:1px solid #d1d5db;color:#111827;text-decoration:none">Health JSON</a>
    </div>

    <section style="padding:20px;border:1px solid #e5e7eb;border-radius:14px;margin-bottom:18px">
        <h2 style="margin-top:0">Runtime</h2>
        <p>Engine: <strong>{{ ($settings['enabled'] ?? false) ? 'Enabled' : 'Disabled' }}</strong></p>
        <p>Offline execution: <strong>{{ ($settings['offline_enabled'] ?? false) ? 'Enabled' : 'Disabled' }}</strong></p>
        <p>LocalBrain: <strong>{{ ($settings['local_intelligence_enabled'] ?? false) ? 'Enabled' : 'Disabled' }}</strong></p>
        <p>Renderer: <strong>{{ $settings['default_renderer'] ?? 'hybrid' }}</strong></p>
    </section>

    <section style="padding:20px;border:1px solid #e5e7eb;border-radius:14px;margin-bottom:18px">
        <h2 style="margin-top:0">Security readiness</h2>
        <ul>
            <li>Approval signing: <strong>{{ ($secrets['approval_secret']['configured'] ?? false) ? 'Configured' : 'Needs configuration' }}</strong></li>
            <li>Offline outbox encryption: <strong>{{ ($secrets['outbox_secret']['configured'] ?? false) ? 'Configured' : 'Needs configuration' }}</strong></li>
        </ul>
        @if(!($secrets['approval_secret']['configured'] ?? false) || !($secrets['outbox_secret']['configured'] ?? false))
            <p style="padding:12px 14px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px">The extension can boot safely while secrets are missing. Approval-required actions and/or encrypted offline queueing remain fail-closed until configured.</p>
        @endif
    </section>

    <section style="padding:20px;border:1px solid #e5e7eb;border-radius:14px;margin-bottom:18px">
        <h2 style="margin-top:0">Capability providers</h2>
        <ul>@foreach($providers as $name=>$provider)<li><strong>{{ strtoupper($name) }}</strong>: {{ $provider['supported'] }}/{{ $provider['declared'] }} supported</li>@endforeach</ul>
    </section>
</div>

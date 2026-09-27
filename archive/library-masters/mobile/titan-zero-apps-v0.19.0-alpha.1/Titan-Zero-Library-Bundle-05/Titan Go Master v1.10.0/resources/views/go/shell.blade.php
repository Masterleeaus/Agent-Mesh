@php
    $bootstrap = is_array($goBootstrap ?? null) ? $goBootstrap : [];
    $runtime = is_array($bootstrap['runtime'] ?? null) ? $bootstrap['runtime'] : [];
@endphp
<div
    data-titan-app="go"
    data-workspace="{{ $workspace ?? 'today' }}"
    data-company-boundary="company_id"
    data-runtime-mode="{{ $runtime['mode'] ?? 'degraded-shell' }}"
    data-interface-contract="{{ $bootstrap['contracts']['interface'] ?? 'App\\Extensions\\TitanInterfaceRuntime\\System\\Contracts\\InterfaceRuntime' }}"
    data-visual-contract="{{ $bootstrap['contracts']['visual'] ?? 'App\\Extensions\\TitanVisualRuntime\\System\\Contracts\\VisualRuntime' }}"
    data-interaction-contract="{{ $bootstrap['contracts']['interaction'] ?? 'App\\Extensions\\InteractionEngine\\System\\Contracts\\PublicInteractionEngineInterface' }}"
>
    <div id="titan-go-runtime-status" role="status" aria-live="polite" data-online="unknown" data-mode="{{ $runtime['mode'] ?? 'degraded-shell' }}"></div>
    <main id="titan-go-workspace" aria-live="polite" aria-busy="false"></main>
    <nav aria-label="Titan Go">
        <a href="{{ route('go.today') }}">Today</a>
        <a href="{{ route('go.jobs') }}">Jobs</a>
        <a href="{{ route('go.schedule') }}">Schedule</a>
        <a href="{{ route('go.inbox') }}">Inbox</a>
        <a href="{{ route('go.more') }}">More</a>
    </nav>
    <script type="application/json" id="titan-go-bootstrap">{!! json_encode($bootstrap, JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT) !!}</script>
    <script src="{{ route('go.runtime.client') }}" defer></script>
</div>

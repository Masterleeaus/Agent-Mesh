<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? 'Titan Builder' }} · Titan Builder</title>
    <link rel="stylesheet" href="{{ asset('vendor/titan-builder/css/titan-generative-ui.css') }}">
    <link rel="stylesheet" href="{{ asset('vendor/titan-builder/premium/mobilekit/titan-mobilekit-premium.css') }}">
    <link rel="stylesheet" href="{{ asset('vendor/titan-builder/management/titan-builder-management.css') }}">
    @stack('head')
</head>
<body class="tbm-body" data-titan-builder-management="0.9.2">
<div class="tbm-shell">
    <aside class="tbm-sidebar" id="tbm-sidebar">
        <a class="tbm-brand" href="{{ route($adminMode ? 'titan-builder.admin.dashboard' : 'titan-builder.manage.dashboard') }}">
            <span class="tbm-brand-mark">T</span>
            <span><strong>Titan Builder</strong><small>{{ $adminMode ? 'Super Admin' : 'Management' }}</small></span>
        </a>
        <nav class="tbm-nav" aria-label="Titan Builder navigation">
            @if($adminMode)
                <a class="{{ request()->routeIs('titan-builder.admin.dashboard') ? 'is-active' : '' }}" href="{{ route('titan-builder.admin.dashboard') }}">Overview</a>
                <a class="{{ request()->routeIs('titan-builder.admin.integrations') ? 'is-active' : '' }}" href="{{ route('titan-builder.admin.integrations') }}">Integrations</a>
                <a class="{{ request()->routeIs('titan-builder.admin.registry') ? 'is-active' : '' }}" href="{{ route('titan-builder.admin.registry') }}">Registry</a>
                <a class="{{ request()->routeIs('titan-builder.admin.verticals') ? 'is-active' : '' }}" href="{{ route('titan-builder.admin.verticals') }}">Vertical packs</a>
                <a class="{{ request()->routeIs('titan-builder.admin.permissions') ? 'is-active' : '' }}" href="{{ route('titan-builder.admin.permissions') }}">Permissions</a>
                <a class="{{ request()->routeIs('titan-builder.admin.diagnostics') ? 'is-active' : '' }}" href="{{ route('titan-builder.admin.diagnostics') }}">Diagnostics</a>
                <a class="{{ request()->routeIs('titan-builder.admin.settings') ? 'is-active' : '' }}" href="{{ route('titan-builder.admin.settings') }}">Settings</a>
                <div class="tbm-nav-separator"></div>
                <a href="{{ route('titan-builder.manage.dashboard') }}">Company Builder</a>
            @else
                <a class="{{ request()->routeIs('titan-builder.manage.dashboard') ? 'is-active' : '' }}" href="{{ route('titan-builder.manage.dashboard') }}">Home</a>
                <a class="{{ request()->routeIs('titan-builder.manage.projects','titan-builder.manage.project') ? 'is-active' : '' }}" href="{{ route('titan-builder.manage.projects') }}">Projects</a>
                <a class="{{ request()->routeIs('titan-builder.manage.applications','titan-builder.manage.application') ? 'is-active' : '' }}" href="{{ route('titan-builder.manage.applications') }}">Applications</a>
                <a class="{{ request()->routeIs('titan-builder.manage.assets') ? 'is-active' : '' }}" href="{{ route('titan-builder.manage.assets') }}">Assets</a>
                <a class="{{ request()->routeIs('titan-builder.manage.brand') ? 'is-active' : '' }}" href="{{ route('titan-builder.manage.brand') }}">Brand & theme</a>
                <a class="{{ request()->routeIs('titan-builder.manage.integrations') ? 'is-active' : '' }}" href="{{ route('titan-builder.manage.integrations') }}">Integrations</a>
                <a class="{{ request()->routeIs('titan-builder.manage.permissions') ? 'is-active' : '' }}" href="{{ route('titan-builder.manage.permissions') }}">Permissions</a>
                <a class="{{ request()->routeIs('titan-builder.manage.settings') ? 'is-active' : '' }}" href="{{ route('titan-builder.manage.settings') }}">Settings</a>
                @if(auth()->check() && method_exists(auth()->user(), 'can') && auth()->user()->can('builder.admin'))
                    <div class="tbm-nav-separator"></div>
                    <a href="{{ route('titan-builder.admin.dashboard') }}">Super Admin</a>
                @endif
            @endif
        </nav>
        <div class="tbm-sidebar-meta">
            <span>v{{ $managementVersion ?? '0.9.2' }}</span>
            @if(!$adminMode && $companyId)<span>Company #{{ $companyId }}</span>@endif
        </div>
    </aside>

    <div class="tbm-workspace">
        <header class="tbm-topbar">
            <button class="tbm-icon-button" type="button" data-tbm-sidebar-toggle aria-controls="tbm-sidebar" aria-label="Toggle navigation">☰</button>
            <div>
                <p class="tbm-eyebrow">{{ $adminMode ? 'Platform control' : 'Company workspace' }}</p>
                <h1>{{ $title ?? 'Titan Builder' }}</h1>
            </div>
            <div class="tbm-topbar-actions">
                @yield('topbar-actions')
            </div>
        </header>

        <main class="tbm-main">
            @if(session('status'))
                <div class="tbm-notice is-success" role="status">{{ session('status') }}</div>
            @endif
            @if($errors->any())
                <div class="tbm-notice is-error" role="alert">
                    <strong>Check the highlighted settings.</strong>
                    <ul>@foreach($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul>
                </div>
            @endif
            <div id="tbm-live-notice" class="tbm-notice" hidden role="status"></div>
            @yield('content')
        </main>
    </div>
</div>
<script src="{{ asset('vendor/titan-builder/js/titan-generative-ui.js') }}"></script>
<script src="{{ asset('vendor/titan-builder/premium/mobilekit/titan-mobilekit-premium.js') }}"></script>
<script src="{{ asset('vendor/titan-builder/management/titan-builder-management.js') }}"></script>
@stack('scripts')
</body>
</html>

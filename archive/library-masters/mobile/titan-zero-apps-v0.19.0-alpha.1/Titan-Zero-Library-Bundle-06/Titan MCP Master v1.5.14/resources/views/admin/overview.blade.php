@extends('panel.layout.app')
@section('content')
<div class="titan-mcp-overview container-fluid py-4">
    <link rel="stylesheet" href="{{ route('dashboard.admin.titan-mcp.styles', ['v' => config('titan_mcp.server.version')]) }}">
    <div class="titan-mcp-card lqd-card card bg-card-background text-card-foreground border-card-border shadow-sm mb-4">
        <div class="card-body d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
                <div class="text-muted small text-uppercase mb-1">Super Admin control centre</div>
                <h1 class="h3 mb-1">Titan MCP</h1>
                <p class="text-muted mb-0">Governed server intelligence, recovery and mutation gateway.</p>
            </div>
            <span class="badge {{ config('titan_mcp.enabled') ? 'bg-success' : 'bg-secondary' }}">
                {{ config('titan_mcp.enabled') ? 'Enabled' : 'Disabled' }}
            </span>
        </div>
    </div>

    @if($legacyRootProviderDetected)
        <div class="alert alert-warning shadow-sm">
            Legacy root-level Titan MCP provider code is present. Remove or disable the legacy integration after confirming this extension is active to avoid duplicate management surfaces.
        </div>
    @endif

    <div class="row g-4 mb-4">
        <div class="col-xxl-3 col-md-6">
            <div class="titan-mcp-card lqd-card card bg-card-background text-card-foreground border-card-border h-100 shadow-sm">
                <div class="card-body">
                    <div class="text-muted small text-uppercase mb-2">Endpoint</div>
                    <div class="mb-3"><code class="d-block text-break">{{ $endpoint }}</code></div>
                    <span class="badge {{ $mcpRouteRegistered ? 'bg-success' : 'bg-secondary' }}">
                        {{ $mcpRouteRegistered ? 'Route registered' : 'Route not registered' }}
                    </span>
                </div>
            </div>
        </div>
        <div class="col-xxl-3 col-md-6">
            <div class="titan-mcp-card lqd-card card bg-card-background text-card-foreground border-card-border h-100 shadow-sm">
                <div class="card-body">
                    <div class="text-muted small text-uppercase mb-2">Tool catalogue</div>
                    <div class="h4 mb-2">{{ $toolCount }} tools</div>
                    <code class="d-block text-break" title="{{ $contractHash }}">{{ $contractHash }}</code>
                </div>
            </div>
        </div>
        <div class="col-xxl-3 col-md-6">
            <div class="titan-mcp-card lqd-card card bg-card-background text-card-foreground border-card-border h-100 shadow-sm">
                <div class="card-body">
                    <div class="text-muted small text-uppercase mb-2">Audit chain</div>
                    <div class="h4 mb-2">{{ ($auditIntegrity['valid'] ?? false) ? 'Valid' : 'Needs attention' }}</div>
                    <div class="text-muted">Entries: {{ $auditIntegrity['entries'] ?? 0 }}</div>
                </div>
            </div>
        </div>
        <div class="col-xxl-3 col-md-6">
            <div class="titan-mcp-card lqd-card card bg-card-background text-card-foreground border-card-border h-100 shadow-sm">
                <div class="card-body">
                    <div class="text-muted small text-uppercase mb-2">Safety</div>
                    <div class="d-flex justify-content-between gap-3 mb-2">
                        <span>Writes</span>
                        <strong>{{ config('titan_mcp.write.enabled') ? 'Enabled' : 'Disabled' }}</strong>
                    </div>
                    <div class="d-flex justify-content-between gap-3">
                        <span>Destructive</span>
                        <strong>{{ config('titan_mcp.destructive.enabled') ? 'Enabled' : 'Disabled' }}</strong>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
        <div>
            <div class="text-muted small text-uppercase mb-1">Administration areas</div>
            <h2 class="h4 mb-1">Open a governed control card</h2>
            <p class="text-muted mb-0">Each section below is a direct entry card into a Titan MCP administration surface.</p>
        </div>
    </div>

    <div class="row g-4 mb-4">
        <div class="col-xxl-4 col-lg-6">
            <div class="titan-mcp-card lqd-card card bg-card-background text-card-foreground border-card-border h-100 shadow-sm position-relative">
                <div class="card-header bg-transparent pb-0 border-0">
                    <div class="text-muted small text-uppercase">Governed tools</div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h3 class="h4 mb-3">Tool Catalogue</h3>
                    <p class="text-muted flex-grow-1 mb-4">Review all {{ $toolCount }} MCP tools, capabilities, access modes and safety annotations from one catalogue.</p>
                    <div><a class="btn btn-outline-primary stretched-link" href="{{ route('dashboard.admin.titan-mcp.tools') }}">Open Tool Catalogue</a></div>
                </div>
            </div>
        </div>
        <div class="col-xxl-4 col-lg-6">
            <div class="titan-mcp-card lqd-card card bg-card-background text-card-foreground border-card-border h-100 shadow-sm position-relative">
                <div class="card-header bg-transparent pb-0 border-0">
                    <div class="text-muted small text-uppercase">Diagnostics</div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h3 class="h4 mb-3">Runtime Health</h3>
                    <p class="text-muted flex-grow-1 mb-4">Inspect host, extension, transport and runtime health from one admin surface.</p>
                    <div><a class="btn btn-outline-primary stretched-link" href="{{ route('dashboard.admin.titan-mcp.runtime') }}">Open Runtime Health</a></div>
                </div>
            </div>
        </div>
        <div class="col-xxl-4 col-lg-6">
            <div class="titan-mcp-card lqd-card card bg-card-background text-card-foreground border-card-border h-100 shadow-sm position-relative">
                <div class="card-header bg-transparent pb-0 border-0">
                    <div class="text-muted small text-uppercase">Recovery</div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h3 class="h4 mb-3">Backups and Recovery</h3>
                    <p class="text-muted flex-grow-1 mb-4">Verify pre-write evidence, backup manifests, restore readiness and recovery state.</p>
                    <div><a class="btn btn-outline-primary stretched-link" href="{{ route('dashboard.admin.titan-mcp.backups') }}">Open Backups and Recovery</a></div>
                </div>
            </div>
        </div>
        <div class="col-xxl-4 col-lg-6">
            <div class="titan-mcp-card lqd-card card bg-card-background text-card-foreground border-card-border h-100 shadow-sm position-relative">
                <div class="card-header bg-transparent pb-0 border-0">
                    <div class="text-muted small text-uppercase">Evidence</div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h3 class="h4 mb-3">Audit Ledger</h3>
                    <p class="text-muted flex-grow-1 mb-4">Review the tamper-evident operation chain, receipts and governance evidence.</p>
                    <div><a class="btn btn-outline-primary stretched-link" href="{{ route('dashboard.admin.titan-mcp.audit') }}">Open Audit Ledger</a></div>
                </div>
            </div>
        </div>
        <div class="col-xxl-4 col-lg-6">
            <div class="titan-mcp-card lqd-card card bg-card-background text-card-foreground border-card-border h-100 shadow-sm position-relative">
                <div class="card-header bg-transparent pb-0 border-0">
                    <div class="text-muted small text-uppercase">Governance</div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h3 class="h4 mb-3">Access and Permissions</h3>
                    <p class="text-muted flex-grow-1 mb-4">Inspect MCP capabilities, Super Admin access and mutation authorization boundaries.</p>
                    <div><a class="btn btn-outline-primary stretched-link" href="{{ route('dashboard.admin.titan-mcp.permissions') }}">Open Access and Permissions</a></div>
                </div>
            </div>
        </div>
        <div class="col-xxl-4 col-lg-6">
            <div class="titan-mcp-card lqd-card card bg-card-background text-card-foreground border-card-border h-100 shadow-sm position-relative">
                <div class="card-header bg-transparent pb-0 border-0">
                    <div class="text-muted small text-uppercase">Configuration</div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h3 class="h4 mb-3">Settings</h3>
                    <p class="text-muted flex-grow-1 mb-4">Configure transport, trusted origins, write gates and operational limits.</p>
                    <div><a class="btn btn-outline-primary stretched-link" href="{{ route('dashboard.admin.titan-mcp.settings') }}">Open Settings</a></div>
                </div>
            </div>
        </div>
    </div>

    <div class="titan-mcp-card lqd-card card bg-card-background text-card-foreground border-card-border shadow-sm">
        <div class="card-header bg-transparent">
            <strong>Runtime</strong>
        </div>
        <div class="card-body">
            <div class="row g-4">
                <div class="col-xl-3 col-md-6">
                    <div class="titan-mcp-card lqd-card card bg-card-background text-card-foreground border-card-border h-100 shadow-sm">
                        <div class="card-body">
                            <div class="text-muted small text-uppercase mb-2">Extension version</div>
                            <div class="h5 mb-0">{{ config('titan_mcp.server.version') }}</div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6">
                    <div class="titan-mcp-card lqd-card card bg-card-background text-card-foreground border-card-border h-100 shadow-sm">
                        <div class="card-body">
                            <div class="text-muted small text-uppercase mb-2">PHP</div>
                            <div class="h5 mb-0">{{ $versions['php']['runtime'] ?? PHP_VERSION }}</div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6">
                    <div class="titan-mcp-card lqd-card card bg-card-background text-card-foreground border-card-border h-100 shadow-sm">
                        <div class="card-body">
                            <div class="text-muted small text-uppercase mb-2">Laravel</div>
                            <div class="h5 mb-0">{{ $versions['laravel']['runtime'] ?? app()->version() }}</div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6">
                    <div class="titan-mcp-card lqd-card card bg-card-background text-card-foreground border-card-border h-100 shadow-sm">
                        <div class="card-body">
                            <div class="text-muted small text-uppercase mb-2">Transport</div>
                            <div class="h5 mb-0">Streamable HTTP JSON-RPC</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

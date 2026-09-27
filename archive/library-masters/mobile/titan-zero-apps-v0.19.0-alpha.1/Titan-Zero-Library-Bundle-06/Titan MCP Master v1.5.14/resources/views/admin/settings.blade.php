@extends('panel.layout.app')
@section('content')
<div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-start mb-4">
        <div><h1 class="h3 mb-1">Titan MCP</h1><p class="text-muted mb-0">Governed server access, recovery and execution controls.</p></div>
        <span class="badge {{ config('titan_mcp.enabled') ? 'bg-success' : 'bg-secondary' }}">{{ config('titan_mcp.enabled') ? 'Enabled' : 'Disabled' }}</span>
    </div>
    @if(session('status'))
        <div class="alert alert-success">{{ session('status') }}</div>
    @endif
    <div class="row g-4 mb-4">
        <div class="col-lg-4"><div class="card h-100"><div class="card-body"><div class="text-muted small">Server</div><strong>{{ config('titan_mcp.server.name') }}</strong><div class="small">v{{ config('titan_mcp.server.version') }}</div></div></div></div>
        <div class="col-lg-4"><div class="card h-100"><div class="card-body"><div class="text-muted small">Endpoint</div><code>{{ $endpoint }}</code><div class="small mt-2">Route: {{ $mcpRouteRegistered ? 'registered' : 'not currently registered' }}</div></div></div></div>
        <div class="col-lg-4"><div class="card h-100"><div class="card-body"><div class="text-muted small">Safety</div><div>Writes: <strong>{{ config('titan_mcp.write.enabled') ? 'enabled' : 'disabled' }}</strong></div><div>Destructive: <strong>{{ config('titan_mcp.destructive.enabled') ? 'enabled' : 'disabled' }}</strong></div></div></div></div>
    </div>
    <form method="post" action="{{ route('dashboard.admin.titan-mcp.update') }}">@csrf
        <div class="card mb-4"><div class="card-header"><strong>Access & mutation gates</strong></div><div class="card-body row g-3">
            @foreach(['enabled'=>'MCP server enabled','require_token_scope'=>'Require mcp:use token scope','write_enabled'=>'Repository writes enabled','database_write_enabled'=>'Database writes enabled','destructive_enabled'=>'Destructive operations enabled','execution_enabled'=>'Artisan execution enabled','database_query_enabled'=>'Raw read-only SQL enabled','recover_failed_mutations'=>'Recover failed command mutations','storage_encryption_attested'=>'Storage encryption-at-rest attested'] as $field=>$label)
            @php($map=['enabled'=>'enabled','require_token_scope'=>'auth.require_token_scope','write_enabled'=>'write.enabled','database_write_enabled'=>'write.database_enabled','destructive_enabled'=>'destructive.enabled','execution_enabled'=>'execution.enabled','database_query_enabled'=>'database.query_enabled','recover_failed_mutations'=>'execution.recover_failed_mutations','storage_encryption_attested'=>'security.storage_encryption_attested'])
            <div class="col-md-6"><input type="hidden" name="{{ $field }}" value="0"><div class="form-check form-switch"><input class="form-check-input" type="checkbox" name="{{ $field }}" id="{{ $field }}" value="1" @checked(config('titan_mcp.'.$map[$field]))><label class="form-check-label" for="{{ $field }}">{{ $label }}</label></div></div>
            @endforeach
        </div></div>
        <div class="card mb-4"><div class="card-header"><strong>Network & limits</strong></div><div class="card-body row g-3">
            <div class="col-12"><label class="form-label">Allowed CORS origins</label><textarea class="form-control" name="cors_origins" rows="3">{{ implode("\n", (array)config('titan_mcp.http.cors_origins',[])) }}</textarea><div class="form-text">One HTTP/HTTPS origin per line. Codee Chrome can use an explicitly allowlisted chrome-extension://&lt;extension-id&gt; origin.</div></div>
            @foreach(['rate_limit_ip_per_minute'=>['IP requests / min','http.rate_limit_ip_per_minute'],'rate_limit_actor_per_minute'=>['Actor requests / min','http.rate_limit_actor_per_minute'],'max_write_bytes'=>['Max repository write bytes','repository.max_write_bytes'],'retention_days'=>['Backup retention days','backups.retention_days'],'retention_max_deletes_per_run'=>['Max backup deletions / cleanup','backups.retention_max_deletes_per_run'],'timeout_seconds'=>['Mutation timeout seconds','execution.timeout_seconds'],'readonly_timeout_seconds'=>['Read-only command timeout seconds','execution.readonly_timeout_seconds'],'max_output_chars'=>['Max command output chars','execution.max_output_chars'],'mutation_lock_timeout_seconds'=>['Mutation lock timeout seconds','execution.mutation_lock_timeout_seconds'],'mutation_ticket_ttl_seconds'=>['Mutation ticket default TTL seconds','mutation_tickets.default_ttl_seconds'],'mutation_ticket_max_ttl_seconds'=>['Mutation ticket maximum TTL seconds','mutation_tickets.max_ttl_seconds']] as $field=>$meta)
            <div class="col-md-6"><label class="form-label">{{ $meta[0] }}</label><input class="form-control" type="number" step="{{ $field==='mutation_lock_timeout_seconds' ? '0.05':'1' }}" name="{{ $field }}" value="{{ config('titan_mcp.'.$meta[1]) }}" required></div>
            @endforeach
        </div></div>
        <button class="btn btn-primary" type="submit">Save Titan MCP settings</button>
    </form>
</div>
@endsection

@extends('panel.layout.app')
@section('content')
<div class="container-fluid py-4">
    <div class="mb-4"><h1 class="h3 mb-1">Titan MCP Runtime Health</h1><p class="text-muted mb-0">Read-only operational status for the MCP extension and host runtime.</p></div>
    <div class="row g-3 mb-4">
        <div class="col-md-4"><div class="card h-100"><div class="card-body"><div class="text-muted small">Extension</div><div class="h4 mb-0">v{{ data_get($versions,'titan_mcp.version','1.5.14') }}</div></div></div></div>
        <div class="col-md-4"><div class="card h-100"><div class="card-body"><div class="text-muted small">Queue</div><div class="h4 mb-0">{{ $queue['driver'] ?? 'unknown' }}</div><div class="small text-muted">Pending: {{ $queue['pending'] ?? 'n/a' }} · Failed: {{ $queue['failed'] ?? 'n/a' }}</div></div></div></div>
        <div class="col-md-4"><div class="card h-100"><div class="card-body"><div class="text-muted small">Migrations</div><div class="h4 mb-0">{{ $migrations['pending'] ?? 0 }} pending</div><div class="small text-muted">{{ $migrations['ran'] ?? 0 }} ran / {{ $migrations['files'] ?? 0 }} files</div></div></div></div>
    </div>
    <div class="card mb-4"><div class="card-header"><strong>Scheduled tasks</strong></div><div class="table-responsive"><table class="table mb-0"><thead><tr><th>Cron</th><th>Task</th><th>Timezone</th></tr></thead><tbody>
        @forelse(($scheduler['items'] ?? []) as $event)
            <tr><td><code>{{ $event['expression'] }}</code></td><td>{{ $event['summary'] }}</td><td>{{ $event['timezone'] ?? 'default' }}</td></tr>
        @empty
            <tr><td colspan="3" class="text-muted">No scheduled tasks discovered.</td></tr>
        @endforelse
    </tbody></table></div></div>
</div>
@endsection

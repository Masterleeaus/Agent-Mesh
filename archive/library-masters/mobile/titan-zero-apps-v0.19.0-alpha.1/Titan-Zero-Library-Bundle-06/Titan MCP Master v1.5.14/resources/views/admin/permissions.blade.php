@extends('panel.layout.app')
@section('content')
<div class="container-fluid py-4">
    <div class="mb-4"><h1 class="h3 mb-1">Titan MCP Access & Permissions</h1><p class="text-muted mb-0">Role-level MCP permission posture. User assignments are intentionally not displayed.</p></div>
    <div class="card mb-4"><div class="card-body"><div class="row"><div class="col-md-4"><div class="text-muted small">MCP permissions</div><div class="h3 mb-0">{{ $permissionSummary['mcp_permissions'] ?? 0 }}</div></div><div class="col-md-4"><div class="text-muted small">Permission store</div><div class="h3 mb-0">{{ ($permissionSummary['permissions_table'] ?? false) ? 'Ready' : 'Unavailable' }}</div></div><div class="col-md-4"><div class="text-muted small">Role store</div><div class="h3 mb-0">{{ ($permissionSummary['roles_table'] ?? false) ? 'Ready' : 'Unavailable' }}</div></div></div></div></div>
    <div class="card"><div class="table-responsive"><table class="table mb-0"><thead><tr><th>Role</th><th>Guard</th><th>MCP permissions</th></tr></thead><tbody>
        @forelse(($permissionSummary['roles'] ?? []) as $role)
            <tr><td>{{ $role['name'] }}</td><td>{{ $role['guard'] }}</td><td>{{ $role['mcp_permissions'] }}</td></tr>
        @empty
            <tr><td colspan="3" class="text-muted">No MCP role grants discovered.</td></tr>
        @endforelse
    </tbody></table></div></div>
</div>
@endsection

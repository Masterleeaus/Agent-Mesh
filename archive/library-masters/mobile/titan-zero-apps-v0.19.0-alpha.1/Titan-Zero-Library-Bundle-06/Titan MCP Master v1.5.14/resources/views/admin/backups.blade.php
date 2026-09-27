@extends('panel.layout.app')
@section('content')
<div class="container-fluid py-4">
    <div class="mb-4"><h1 class="h3 mb-1">Titan MCP Backups & Recovery</h1><p class="text-muted mb-0">Verified filesystem and database recovery points. Payload contents are not exposed here.</p></div>
    <div class="card"><div class="table-responsive"><table class="table align-middle mb-0"><thead><tr><th>Backup</th><th>Type</th><th>Created</th><th>Integrity</th></tr></thead><tbody>
        @forelse(($backups['items'] ?? []) as $item)
            <tr>
                <td><code>{{ $item['backup_id'] }}</code></td>
                <td>{{ ucfirst($item['type']) }}</td>
                <td>{{ $item['created_at'] ?? 'unknown' }}</td>
                <td><span class="badge {{ $item['valid'] ? 'bg-success' : 'bg-danger' }}">{{ $item['valid'] ? 'Verified' : 'Invalid' }}</span></td>
            </tr>
        @empty
            <tr><td colspan="4" class="text-muted">No Titan MCP recovery points found.</td></tr>
        @endforelse
    </tbody></table></div></div>
</div>
@endsection

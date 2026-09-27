@extends('panel.layout.app')
@section('content')
<div class="container-fluid py-4">
    <div class="mb-4"><h1 class="h3 mb-1">Titan MCP Tool Catalogue</h1><p class="text-muted mb-0">{{ count($tools) }} governed tools · contract <code>{{ $contractHash }}</code></p></div>
    <div class="card"><div class="table-responsive"><table class="table align-middle mb-0"><thead><tr><th>Tool</th><th>Category</th><th>Capability</th><th>Mode</th><th>Description</th></tr></thead><tbody>
        @foreach($tools as $tool)
            <tr>
                <td><code>{{ $tool['name'] }}</code><div class="small">{{ $tool['title'] }}</div></td>
                <td>{{ $tool['category'] }}</td>
                <td><code>{{ $tool['capability'] }}</code></td>
                <td>{{ $tool['annotations']['readOnlyHint'] ? 'Read' : 'Write' }}{{ $tool['annotations']['destructiveHint'] ? ' / Destructive' : '' }}</td>
                <td>{{ $tool['description'] }}</td>
            </tr>
        @endforeach
    </tbody></table></div></div>
</div>
@endsection

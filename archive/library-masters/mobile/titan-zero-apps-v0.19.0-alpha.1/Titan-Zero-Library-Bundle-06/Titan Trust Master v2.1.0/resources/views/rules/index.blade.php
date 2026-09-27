@extends('panel.user.layout.app')

@section('title', 'Evidence Rules')

@section('content')
<div class="container py-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">Evidence Rules</h3>
        <div class="d-flex gap-2">
            <a href="{{ route('dashboard.user.titan-trust.index') }}" class="btn btn-outline-secondary">Back to Evidence</a>
            <a href="{{ route('dashboard.user.titan-trust.rules.create') }}" class="btn btn-primary">New Rule</a>
        </div>
    </div>

    @if(session('success'))
        <div class="alert alert-success">{{ session('success') }}</div>
    @endif

    <div class="card">
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table mb-0">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Template</th>
                            <th>Job Type</th>
                            <th>Site Type</th>
                            <th>Required</th>
                            <th class="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($rules as $rule)
                            <tr>
                                <td>#{{ $rule->id }}</td>
                                <td>{{ $rule->template_id ?? '-' }}</td>
                                <td>{{ $rule->job_type ?? '-' }}</td>
                                <td>{{ $rule->site_type ?? '-' }}</td>
                                <td class="small text-muted">
                                    before: {{ $rule->required['before'] ?? 0 }},
                                    after: {{ $rule->required['after'] ?? 0 }},
                                    incident: {{ $rule->required['incident'] ?? 0 }},
                                    signoff: {{ $rule->required['signoff'] ?? 0 }}
                                </td>
                                <td class="text-end">
                                    <a class="btn btn-sm btn-outline-primary" href="{{ route('dashboard.user.titan-trust.rules.edit', $rule->id) }}">Edit</a>
                                    <form method="POST" action="{{ route('dashboard.user.titan-trust.rules.destroy', $rule->id) }}" class="d-inline" onsubmit="return confirm('Delete this rule?');">
                                        @csrf
                                        @method('DELETE')
                                        <button class="btn btn-sm btn-outline-danger" type="submit">Delete</button>
                                    </form>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="6" class="text-center py-4 text-muted">No rules yet.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
@endsection

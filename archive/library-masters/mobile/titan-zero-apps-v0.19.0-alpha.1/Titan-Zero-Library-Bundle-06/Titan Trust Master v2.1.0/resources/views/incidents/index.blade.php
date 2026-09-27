@extends('panel.user.layout.app')

@section('title', 'Incidents')

@section('content')
<div class="container py-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">Incidents</h3>
        <a class="btn btn-primary" href="{{ route('dashboard.user.titan-trust.incidents.create', request()->only(['job_id','task_id'])) }}">New Incident</a>
    </div>

    <form class="row g-2 mb-3" method="GET" action="{{ route('dashboard.user.titan-trust.incidents.index') }}">
        <div class="col-md-3">
            <input class="form-control" name="job_id" placeholder="Job ID" value="{{ request('job_id') }}">
        </div>
        <div class="col-md-3">
            <select class="form-select" name="status">
                <option value="">Any status</option>
                @foreach(['open','needs_review','resolved','void'] as $s)
                    <option value="{{ $s }}" @selected(request('status')===$s)>{{ ucfirst(str_replace('_',' ',$s)) }}</option>
                @endforeach
            </select>
        </div>
        <div class="col-md-3">
            <select class="form-select" name="severity">
                <option value="">Any severity</option>
                @foreach(['low','medium','high','critical'] as $s)
                    <option value="{{ $s }}" @selected(request('severity')===$s)>{{ ucfirst($s) }}</option>
                @endforeach
            </select>
        </div>
        <div class="col-md-3">
            <button class="btn btn-outline-secondary w-100" type="submit">Filter</button>
        </div>
    </form>

    <div class="card">
        <div class="table-responsive">
            <table class="table mb-0">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Job</th>
                        <th>Type</th>
                        <th>Severity</th>
                        <th>Status</th>
                        <th>Title</th>
                        <th class="text-end">Action</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($incidents as $i)
                        <tr>
                            <td>#{{ $i->id }}</td>
                            <td>#{{ $i->job_id }}</td>
                            <td>{{ $i->incident_type ?? '-' }}</td>
                            <td>{{ $i->severity ?? '-' }}</td>
                            <td><span class="badge bg-{{ $i->status==='resolved' ? 'success' : 'warning text-dark' }}">{{ ucfirst(str_replace('_',' ',$i->status)) }}</span></td>
                            <td>{{ $i->title }}</td>
                            <td class="text-end">
                                <a class="btn btn-sm btn-outline-primary" href="{{ route('dashboard.user.titan-trust.incidents.show', $i->id) }}">View</a>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="7" class="text-center text-muted py-4">No incidents.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    <div class="mt-3">
        {{ $incidents->links() }}
    </div>
</div>
@endsection

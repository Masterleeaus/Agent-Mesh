@extends('layouts.app')

@section('content')
<div class="container-fluid">
    <div class="d-flex align-items-center justify-content-between mb-3">
        <div>
            <h4 class="mb-0">Manager Review</h4>
            <small class="text-muted">Jobs requiring review (compliance flags and open incidents)</small>
        </div>
    </div>

    @if(session('success'))
        <div class="alert alert-success">{{ session('success') }}</div>
    @endif

    <div class="card">
        <div class="card-body">
            @if(!empty($jobs) && count($jobs))
                <div class="table-responsive">
                    <table class="table align-middle">
                        <thead>
                            <tr>
                                <th>Job ID</th>
                                <th>Compliance</th>
                                <th>Open incidents</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($jobs as $j)
                                <tr>
                                    <td class="fw-semibold">#{{ $j['job_id'] }}</td>
                                    <td>
                                        @if($j['compliance'] === 'flagged')
                                            <span class="badge bg-warning text-dark">Flagged</span>
                                        @else
                                            <span class="badge bg-secondary">Unknown</span>
                                        @endif
                                    </td>
                                    <td>
                                        @if($j['open_incidents'] > 0)
                                            <span class="badge bg-danger">{{ $j['open_incidents'] }}</span>
                                        @else
                                            <span class="badge bg-success">0</span>
                                        @endif
                                    </td>
                                    <td class="d-flex gap-2">
                                        <a class="btn btn-sm btn-outline-secondary" href="{{ url('/dashboard/user/jobs/trust/'.$j['job_id'].'/timeline') }}">Timeline</a>
                                        <a class="btn btn-sm btn-outline-secondary" href="{{ url('/dashboard/user/jobs/trust/'.$j['job_id'].'/incidents') }}">Incidents</a>

                                        <form method="POST" action="{{ url('/dashboard/user/jobs/trust/'.$j['job_id'].'/override') }}" class="d-flex gap-2">
                                            @csrf
                                            <input type="text" name="reason" class="form-control form-control-sm" placeholder="Override reason (required)" required>
                                            <button class="btn btn-sm btn-warning">Override</button>
                                        </form>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            @else
                <div class="text-muted">No jobs currently require manager review.</div>
            @endif
        </div>
    </div>
</div>
@endsection

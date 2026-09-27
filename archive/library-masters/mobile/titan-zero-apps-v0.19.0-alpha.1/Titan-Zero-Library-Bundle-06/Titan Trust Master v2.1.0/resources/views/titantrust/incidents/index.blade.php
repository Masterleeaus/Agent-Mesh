@extends('layouts.app')

@section('content')
<div class="container-fluid">
    <div class="d-flex align-items-center justify-content-between mb-3">
        <div>
            <h4 class="mb-0">Incidents</h4>
            <small class="text-muted">Job ID: {{ $jobId }}</small>
        </div>
        <div>
            <a href="{{ url('/dashboard/user/jobs/trust/review') }}" class="btn btn-sm btn-outline-secondary">Back to review</a>
        </div>
    </div>

    @if(session('success'))
        <div class="alert alert-success">{{ session('success') }}</div>
    @endif

    <div class="card">
        <div class="card-body">
            @if(isset($incidents) && count($incidents))
                <div class="list-group">
                    @foreach($incidents as $i)
                        <div class="list-group-item">
                            <div class="d-flex justify-content-between">
                                <div class="fw-semibold">{{ $i->title ?? ('Incident #'.$i->id) }}</div>
                                <div>
                                    <span class="badge bg-secondary">{{ $i->status }}</span>
                                </div>
                            </div>
                            @if(!empty($i->description))
                                <div class="mt-2">{{ $i->description }}</div>
                            @endif
                            <div class="mt-2 text-muted small">Occurred: {{ $i->occurred_at ?? $i->created_at }}</div>

                            @if(($i->status ?? '') !== 'resolved')
                                <form class="mt-3" method="POST" action="{{ url('/dashboard/user/jobs/trust/incidents/'.$i->id.'/resolve') }}">
                                    @csrf
                                    <div class="d-flex gap-2">
                                        <input type="text" class="form-control form-control-sm" name="resolution_note" placeholder="Resolution note" required>
                                        <button class="btn btn-sm btn-success">Resolve</button>
                                    </div>
                                </form>
                            @endif
                        </div>
                    @endforeach
                </div>
            @else
                <div class="text-muted">No incidents found for this job.</div>
            @endif
        </div>
    </div>
</div>
@endsection

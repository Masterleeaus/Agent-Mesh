@extends('layouts.app')

@section('content')
<div class="container-fluid">
    <div class="d-flex align-items-center justify-content-between mb-3">
        <div>
            <h4 class="mb-0">Job Timeline</h4>
            <small class="text-muted">Job ID: {{ $jobId }}</small>
        </div>
        <div>
            <a href="{{ url()->previous() }}" class="btn btn-sm btn-outline-secondary">Back</a>
        </div>
    </div>

    @include('titantrust::partials.timeline', ['events' => $events])
</div>
@endsection

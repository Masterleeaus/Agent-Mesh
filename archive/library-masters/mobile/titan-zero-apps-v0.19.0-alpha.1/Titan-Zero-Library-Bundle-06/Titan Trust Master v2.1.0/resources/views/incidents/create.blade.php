@extends('panel.user.layout.app')

@section('title', 'New Incident')

@section('content')
<div class="container py-3" style="max-width: 860px;">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">New Incident</h3>
        <a class="btn btn-outline-secondary" href="{{ route('dashboard.user.titan-trust.incidents.index') }}">Back</a>
    </div>

    @if($errors->any())
        <div class="alert alert-danger">
            <div class="fw-bold mb-1">Fix the following:</div>
            <ul class="mb-0">
                @foreach($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <div class="card">
        <div class="card-body">
            <form method="POST" action="{{ route('dashboard.user.titan-trust.incidents.store') }}">
                @csrf
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Job ID</label>
                        <input class="form-control" name="job_id" value="{{ old('job_id', $defaults['job_id'] ?? '') }}" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Task ID (optional)</label>
                        <input class="form-control" name="task_id" value="{{ old('task_id', $defaults['task_id'] ?? '') }}">
                    </div>

                    <div class="col-md-6">
                        <label class="form-label">Incident type</label>
                        <select class="form-select" name="incident_type">
                            @foreach(['damage','safety','access','complaint','other'] as $t)
                                <option value="{{ $t }}" @selected(old('incident_type', $defaults['incident_type'] ?? 'other')===$t)>{{ ucfirst($t) }}</option>
                            @endforeach
                        </select>
                    </div>

                    <div class="col-md-6">
                        <label class="form-label">Severity</label>
                        <select class="form-select" name="severity">
                            @foreach(['low','medium','high','critical'] as $s)
                                <option value="{{ $s }}" @selected(old('severity', $defaults['severity'] ?? 'medium')===$s)>{{ ucfirst($s) }}</option>
                            @endforeach
                        </select>
                    </div>

                    <div class="col-12">
                        <label class="form-label">Title</label>
                        <input class="form-control" name="title" value="{{ old('title') }}" required placeholder="e.g. Broken tile in bathroom">
                    </div>

                    <div class="col-12">
                        <label class="form-label">Description (optional)</label>
                        <textarea class="form-control" name="description" rows="4" placeholder="What happened? What did you do?">{{ old('description') }}</textarea>
                    </div>
                </div>

                <div class="mt-4">
                    <button class="btn btn-primary btn-lg w-100" type="submit">Create incident & attach photos</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

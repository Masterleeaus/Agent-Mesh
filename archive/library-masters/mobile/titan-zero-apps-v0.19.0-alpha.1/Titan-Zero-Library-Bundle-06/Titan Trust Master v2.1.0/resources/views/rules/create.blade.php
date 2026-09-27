@extends('panel.user.layout.app')

@section('title', 'New Evidence Rule')

@section('content')
<div class="container py-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">New Evidence Rule</h3>
        <a href="{{ route('dashboard.user.titan-trust.rules.index') }}" class="btn btn-outline-secondary">Back</a>
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
            <form method="POST" action="{{ route('dashboard.user.titan-trust.rules.store') }}">
                @csrf
                @php($rule = (object) ['template_id'=>null,'job_type'=>null,'site_type'=>null,'required'=>[]])
<div class="row g-3">
    <div class="col-md-4">
        <label class="form-label">Template ID (optional)</label>
        <input name="template_id" class="form-control" value="{{ old('template_id', $rule->template_id ?? '') }}">
    </div>
    <div class="col-md-4">
        <label class="form-label">Job Type (optional)</label>
        <input name="job_type" class="form-control" value="{{ old('job_type', $rule->job_type ?? '') }}" placeholder="e.g. regular, end-of-lease">
    </div>
    <div class="col-md-4">
        <label class="form-label">Site Type (optional)</label>
        <input name="site_type" class="form-control" value="{{ old('site_type', $rule->site_type ?? '') }}" placeholder="e.g. house, office">
    </div>
</div>

<hr class="my-4">

<div class="row g-3">
    <div class="col-md-3">
        <label class="form-label">Before</label>
        <input type="number" min="0" max="100" name="req_before" class="form-control" value="{{ old('req_before', $rule->required['before'] ?? 0) }}">
    </div>
    <div class="col-md-3">
        <label class="form-label">After</label>
        <input type="number" min="0" max="100" name="req_after" class="form-control" value="{{ old('req_after', $rule->required['after'] ?? 0) }}">
    </div>
    <div class="col-md-3">
        <label class="form-label">Incident</label>
        <input type="number" min="0" max="100" name="req_incident" class="form-control" value="{{ old('req_incident', $rule->required['incident'] ?? 0) }}">
    </div>
    <div class="col-md-3">
        <label class="form-label">Signoff</label>
        <input type="number" min="0" max="100" name="req_signoff" class="form-control" value="{{ old('req_signoff', $rule->required['signoff'] ?? 0) }}">
    </div>
</div>


                <div class="mt-4">
                    <button class="btn btn-primary" type="submit">Save Rule</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

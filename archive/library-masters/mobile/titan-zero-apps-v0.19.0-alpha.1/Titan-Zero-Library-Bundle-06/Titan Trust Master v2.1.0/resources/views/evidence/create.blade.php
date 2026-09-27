@extends('panel.user.layout.app')

@section('title', 'Upload Evidence')

@section('content')
<div class="container py-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">Upload {{ ($defaults['context'] ?? request('context')) === 'work-gallery' ? 'Work Gallery Item' : 'Evidence' }}</h3>
        <a href="{{ route('dashboard.user.titan-trust.index') }}" class="btn btn-outline-secondary">Back</a>
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
            <form method="POST" action="{{ route('dashboard.user.titan-trust.store') }}" enctype="multipart/form-data">
                @csrf
                @if(!empty($defaults['context']))
                    <input type="hidden" name="context" value="{{ $defaults['context'] }}">
                @endif

                <div class="mb-3">
                    <label class="form-label">File</label>
                    <input type="file" name="file[]" class="form-control" multiple accept="image/*,application/pdf" capture="environment" required>
                    <div class="form-text">Allowed: jpg, png, webp, pdf. Max size set in config.</div>
                </div>

                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Type</label>
                        <select name="type" class="form-select">
                            @foreach(['before','after','incident','signoff','general'] as $t)
                                <option value="{{ $t }}" @selected(old('type', $defaults['type'] ?? 'general')===$t)>{{ ucfirst($t) }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Job ID (optional)</label>
                        <input name="job_id" class="form-control" value="{{ old('job_id', $defaults['job_id'] ?? '') }}">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Task ID (optional)</label>
                        <input name="task_id" class="form-control" value="{{ old('task_id', $defaults['task_id'] ?? '') }}">
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label">Caption (optional)</label>
                    <textarea name="caption" class="form-control" rows="3">{{ old('caption') }}</textarea>
                </div>

                <div class="mb-3">
                    <label class="form-label">Tags (comma separated)</label>
                    <input name="tags" class="form-control" placeholder="before, kitchen, inspection">
                </div>

                <button class="btn btn-primary" type="submit">Upload</button>
            </form>
        </div>
    </div>
</div>
@endsection

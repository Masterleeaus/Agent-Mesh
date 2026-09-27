@extends('panel.user.layout.app')

@section('title', 'Sign-off Link')

@section('content')
<div class="container py-3">
    <h3 class="mb-3">Client Sign-off Link Created</h3>

    <div class="card">
        <div class="card-body">
            <div class="mb-2"><span class="text-muted">Job:</span> <strong>#{{ $signoff->job_id }}</strong></div>
            <div class="mb-2"><span class="text-muted">Status:</span> <strong>{{ $signoff->status }}</strong></div>
            <div class="mb-3"><span class="text-muted">Expires:</span> <strong>{{ optional($signoff->public_expires_at)->format('Y-m-d H:i') }}</strong></div>

            <label class="form-label">Share this link with the client</label>
            <div class="input-group">
                <input class="form-control" value="{{ $publicUrl }}" readonly onclick="this.select()">
                <button class="btn btn-outline-secondary" type="button" onclick="navigator.clipboard.writeText('{{ $publicUrl }}')">Copy</button>
            </div>

            <div class="mt-3 d-flex gap-2">
                <a class="btn btn-outline-secondary" href="{{ route('dashboard.user.titan-trust.index', ['job_id' => $signoff->job_id]) }}">Back to Evidence</a>
                <a class="btn btn-primary" href="{{ $publicUrl }}" target="_blank">Open Client Page</a>
            </div>
        </div>
    </div>
</div>
@endsection

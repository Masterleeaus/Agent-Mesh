@extends('panel.user.layout.app')

@section('title', 'Evidence #' . $item->id)

@section('content')
<div class="container py-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">Evidence #{{ $item->id }}</h3>
        <a href="{{ route('dashboard.user.titan-trust.index') }}" class="btn btn-outline-secondary">Back</a>
    </div>

    <div class="card">
        <div class="card-body">
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="mb-2"><span class="text-muted">Type:</span> <strong>{{ $item->type }}</strong></div>
                    <div class="mb-2"><span class="text-muted">Job:</span> <strong>{{ $item->job_id ?? '-' }}</strong></div>
                    <div class="mb-2"><span class="text-muted">Task:</span> <strong>{{ $item->task_id ?? '-' }}</strong></div>
                    <div class="mb-2"><span class="text-muted">Captured:</span> <strong>{{ optional($item->captured_at)->format('Y-m-d H:i') }}</strong></div>
                    @if($item->caption)
                        <div class="mb-2"><span class="text-muted">Caption:</span><div>{{ $item->caption }}</div></div>
                    @endif
                    @if($item->file)
                        <div class="mt-3 small text-muted">
                            <div>File: {{ $item->file->original_name }}</div>
                            <div>MIME: {{ $item->file->mime }}</div>
                            <div>Size: {{ number_format($item->file->size/1024, 1) }} KB</div>
                            <div>SHA256: {{ $item->file->sha256 }}</div>
                        </div>
                    @endif
                </div>
                <div class="col-md-6">
                    @if($item->file)
                        @php
                            $url = \Illuminate\Support\Facades\Storage::disk($item->file->disk)->url($item->file->path);
                        @endphp

                        @if(str_starts_with($item->file->mime, 'image/'))
                            <img src="{{ $url }}" class="img-fluid rounded border" alt="Evidence image">
                        @else
                            <a href="{{ $url }}" target="_blank" class="btn btn-outline-primary">Open File</a>
                        @endif
                    @else
                        <div class="text-muted">No file linked.</div>
                    @endif
                </div>
            <div class="mt-2">
    <span class="badge bg-{{ $item->trust_level==='high' ? 'success' : ($item->trust_level==='medium' ? 'warning text-dark' : 'secondary') }}">
        Trust: {{ $item->trust_level ?? '—' }}
    </span>
    @if(!empty($item->captured_lat) && !empty($item->captured_lng))
        <span class="badge bg-light text-dark border">GPS</span>
    @endif
</div>

</div>
        </div>
    </div>
</div>
@endsection

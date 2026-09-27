@extends('panel.user.layout.app')

@section('title', 'Incident')

@section('content')
<div class="container py-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
            <h3 class="mb-0">Incident #{{ $incident->id }}</h3>
            <div class="text-muted">Job #{{ $incident->job_id }} • {{ ucfirst($incident->incident_type ?? 'other') }} • {{ ucfirst($incident->severity ?? 'medium') }}</div>
        </div>
        <div class="d-flex gap-2">
            <a class="btn btn-outline-secondary" href="{{ route('dashboard.user.titan-trust.incidents.index', ['job_id'=>$incident->job_id]) }}">Back</a>
            <a class="btn btn-outline-primary" href="{{ route('dashboard.user.titan-trust.capture.index', ['job_id'=>$incident->job_id,'incident_id'=>$incident->id]) }}">Add photos</a>
        </div>
    </div>

    @if(session('success'))
        <div class="alert alert-success">{{ session('success') }}</div>
    @endif

    <div class="card mb-3">
        <div class="card-body">
            <div class="d-flex justify-content-between">
                <div>
                    <div class="fw-bold">{{ $incident->title }}</div>
                    <div class="text-muted small">Reported: {{ optional($incident->reported_at)->format('Y-m-d H:i') }}</div>
                </div>
                <div>
                    <span class="badge bg-{{ $incident->status==='resolved' ? 'success' : 'warning text-dark' }}">{{ ucfirst(str_replace('_',' ',$incident->status)) }}</span>
                </div>
            </div>
            @if($incident->description)
                <hr>
                <div style="white-space: pre-wrap;">{{ $incident->description }}</div>
            @endif
        </div>
    </div>

    @if($incident->status !== 'resolved')
        <div class="card mb-3">
            <div class="card-body">
                <div class="fw-bold mb-2">Resolve incident</div>
                <form method="POST" action="{{ route('dashboard.user.titan-trust.incidents.resolve', $incident->id) }}">
                    @csrf
                    <textarea class="form-control mb-2" name="resolution_notes" rows="3" placeholder="What was done to resolve this?"></textarea>
                    <button class="btn btn-success" type="submit">Mark resolved</button>
                </form>
            </div>
        </div>
    @endif

    <div class="card">
        <div class="card-body">
            <div class="fw-bold mb-2">Attached photos</div>
            <div class="row g-2">
                @forelse($items as $item)
                    <div class="col-4 col-md-2">
                        @if($item->file && str_starts_with($item->file->mime,'image/'))
                            <img src="{{ Storage::disk($item->file->disk)->url($item->file->path) }}" class="img-fluid rounded border">
                        @else
                            <div class="border rounded p-2 text-center small">{{ strtoupper($item->type) }}</div>
                        @endif
                    </div>
                @empty
                    <div class="text-muted">No photos yet.</div>
                @endforelse
            </div>
        </div>
    </div>
</div>
@endsection

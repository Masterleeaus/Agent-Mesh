@extends('panel.user.layout.app')

@section('title', 'Evidence')

@section('content')
<div class="container py-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">{{ ($context ?? 'job-evidence') === 'work-gallery' ? 'Work Gallery' : 'Evidence' }}</h3>
        <a href="{{ route('dashboard.user.titan-trust.create', request()->only(['context','job_id','task_id','type'])) }}" class="btn btn-primary">Upload Evidence</a>
    </div>

    @if(session('success'))
        <div class="alert alert-success">{{ session('success') }}</div>
    @endif

<div class="d-flex gap-2 mb-3">
    <a href="{{ route('dashboard.user.titan-trust.rules.index') }}" class="btn btn-outline-secondary">Evidence Rules</a>
</div>

@if(!is_null($readiness))
    <div class="card mb-3">
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <div class="fw-bold">Requirements for Job #{{ request('job_id') }}</div>
                    <div class="text-muted small">
                        @if($readiness['rule'])
                            Rule #{{ $readiness['rule']['id'] }}
                            @if($readiness['rule']['job_type']) • Job Type: {{ $readiness['rule']['job_type'] }} @endif
                            @if($readiness['rule']['site_type']) • Site Type: {{ $readiness['rule']['site_type'] }} @endif
                        @else
                            No rule matched (defaults to 0 requirements).
                        @endif
                    </div>
                </div>
                <div>
                    @if($readiness['ready'])
                        <span class="badge bg-success">Ready</span>
                    @else
                        <span class="badge bg-warning text-dark">Missing evidence</span>
                    @endif
                </div>
            </div>

            <div class="row mt-3 g-2">
                @foreach($readiness['required'] as $type => $req)
                    @php
                        $have = $readiness['captured'][$type] ?? 0;
                        $need = $readiness['missing'][$type] ?? 0;
                    @endphp
                    <div class="col-6 col-md-4 col-lg-2">
                        <div class="border rounded p-2">
                            <div class="small text-muted">{{ ucfirst($type) }}</div>
                            <div class="fw-bold">{{ $have }} / {{ (int)$req }}</div>
                            @if($need > 0)
                                <div class="small text-danger">Need {{ $need }}</div>
                            @else
                                <div class="small text-success">OK</div>
                            @endif
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    </div>
@endif

    @if(request('job_id'))
    <div class="card mb-3">
        <div class="card-body">
            <div class="fw-bold mb-2">Quick attach to Job #{{ request('job_id') }}</div>
            <div class="d-flex flex-wrap gap-2">
                @foreach(['before','after','incident','signoff','general'] as $t)
                    <a class="btn btn-sm btn-outline-primary"
                       href="{{ route('dashboard.user.titan-trust.attach', array_merge(request()->only(['job_id','task_id']), ['evidence_type' => $t])) }}">
                        Add {{ ucfirst($t) }}
                    </a>
                @endforeach
            </div>
        </div>
    </div>
@endif

<form class="row g-2 mb-3" method="GET" action="{{ route('dashboard.user.titan-trust.index') }}">
        @if(request('context'))
            <input type="hidden" name="context" value="{{ request('context') }}">
        @endif
        <div class="col-md-3">
            <input class="form-control" name="q" placeholder="Search…" value="{{ request('q') }}">
        </div>
        <div class="col-md-3">
            <input class="form-control" name="job_id" placeholder="Job ID" value="{{ request('job_id') }}">
        </div>
        <div class="col-md-3">
            <input class="form-control" name="task_id" placeholder="Task ID" value="{{ request('task_id') }}">
        </div>
        <div class="col-md-3">
            <select class="form-select" name="type">
                <option value="">Any type</option>
                @foreach(['before','after','incident','signoff','general'] as $t)
                    <option value="{{ $t }}" @selected(request('type')===$t)>{{ ucfirst($t) }}</option>
                @endforeach
            </select>
        </div>
        <div class="col-md-3">
            <button class="btn btn-outline-secondary" type="submit">Filter</button>
            <a class="btn btn-link" href="{{ route('dashboard.user.titan-trust.index') }}">Clear</a>
        </div>
    </form>

    <div class="row g-3">
        @forelse($items as $item)
            @php
                $url = null;
                if ($item->file) {
                    $url = \Illuminate\Support\Facades\Storage::disk($item->file->disk)->url($item->file->path);
                }
            @endphp
            <div class="col-6 col-md-3">
                <div class="card h-100">
                    <div class="ratio ratio-1x1 bg-light">
                        @if($item->file && str_starts_with($item->file->mime, 'image/') && $url)
                            <img src="{{ $url }}" class="w-100 h-100" style="object-fit:cover" alt="Evidence">
                        @else
                            <div class="d-flex align-items-center justify-content-center text-muted">
                                <div class="text-center">
                                    <div class="fw-bold">{{ strtoupper($item->type ?? 'FILE') }}</div>
                                    <div class="small">Open</div>
                                </div>
                            </div>
                        @endif
                    </div>
                    <div class="card-body p-2">
                        <div class="small text-muted">#{{ $item->id }} • {{ $item->type }}</div>
                        <div class="small">Job: {{ $item->job_id ?? '-' }} • Task: {{ $item->task_id ?? '-' }}</div>
                    </div>
                    <div class="card-footer bg-white p-2 d-flex gap-2">
                        <a class="btn btn-sm btn-outline-primary w-100" href="{{ route('dashboard.user.titan-trust.show', $item->id) }}">View</a>
                        <form method="POST" action="{{ route('dashboard.user.titan-trust.destroy', $item->id) }}" class="w-100" onsubmit="return confirm('Delete this evidence?');">
                            @csrf
                            @method('DELETE')
                            <button class="btn btn-sm btn-outline-danger w-100" type="submit">Delete</button>
                        </form>
                    </div>
                </div>
            </div>
        @empty
            <div class="col-12">
                <div class="alert alert-secondary mb-0">No evidence yet.</div>
            </div>
        @endforelse
    </div>

    <div class="mt-3">
        {{ $items->links() }}
    </div>
</div>
@endsection

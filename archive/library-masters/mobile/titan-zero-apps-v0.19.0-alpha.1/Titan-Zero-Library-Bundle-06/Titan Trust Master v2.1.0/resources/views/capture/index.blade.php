@extends('panel.user.layout.app')

@section('title', 'Capture Evidence')

@section('content')
<div class="container py-3">
    <h3 class="mb-3">Job #{{ $jobId }} — Capture Evidence</h3>
    <div class="alert alert-light border small" id="geo-status">Location: <span class="text-muted">Checking…</span></div>

    @if(session('success'))
        <div class="alert alert-success">{{ session('success') }}</div>
    @endif

    <div class="card mb-3">
    <div class="card-body">
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <div class="fw-bold">Presence</div>
                <div class="text-muted small">
                    Arrived: {{ optional($attendance->arrived_at)->format('Y-m-d H:i') ?? '—' }} ({{ $attendance->arrived_source ?? '—' }})
                    • Leaving: {{ optional($attendance->left_at)->format('Y-m-d H:i') ?? '—' }} ({{ $attendance->left_source ?? '—' }})
                </div>
                <div class="text-muted small">
                    Derived: first capture {{ optional($attendance->derived_first_capture_at)->format('Y-m-d H:i') ?? '—' }}
                    • last capture {{ optional($attendance->derived_last_capture_at)->format('Y-m-d H:i') ?? '—' }}
                </div>
            </div>
            <div class="d-flex gap-2">
                <form method="POST" action="{{ route('dashboard.user.titan-trust.attendance.arrived') }}">
                    @csrf
                    <input type="hidden" name="job_id" value="{{ $jobId }}">
                    @if(request('incident_id'))<input type="hidden" name="incident_id" value="{{ request('incident_id') }}">@endif
                    <button class="btn btn-outline-success" type="submit">Arrived</button>
                </form>
                <form method="POST" action="{{ route('dashboard.user.titan-trust.attendance.leaving') }}">
                    @csrf
                    <input type="hidden" name="job_id" value="{{ $jobId }}">
                    @if(request('incident_id'))<input type="hidden" name="incident_id" value="{{ request('incident_id') }}">@endif
                    <button class="btn btn-outline-danger" type="submit">Leaving</button>
                </form>
            </div>
        </div>
    </div>
</div>

<div class="card mb-3">
        <div class="card-body">
            <div class="fw-bold mb-2">Requirements</div>
            <div class="row g-2">
                @foreach($readiness['required'] as $type => $req)
                    @php
                        $have = $readiness['captured'][$type] ?? 0;
                        $need = $readiness['missing'][$type] ?? 0;
                    @endphp
                    <div class="col-6 col-md-3">
                        <div class="border rounded p-2 text-center">
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

    <div class="card mb-3">
        <div class="card-body">
            <div class="fw-bold mb-2">Capture</div>
            <div class="d-flex flex-wrap gap-2">
                @foreach(['before','after','incident','signoff','general'] as $t)
                    <form method="POST" action="{{ route('dashboard.user.titan-trust.capture.store') }}" enctype="multipart/form-data">
                        @csrf
                        <input type="hidden" name="job_id" value="{{ $jobId }}">
                        @if(request('incident_id'))
                            <input type="hidden" name="incident_id" value="{{ request('incident_id') }}">
                        @endif
                        <input type="hidden" name="type" value="{{ $t }}">
                        <input type="hidden" name="captured_lat" class="captured_lat">
                        <input type="hidden" name="captured_lng" class="captured_lng">
                        <input type="hidden" name="captured_accuracy_m" class="captured_accuracy_m">
                        <input type="hidden" name="captured_source" class="captured_source" value="unknown">
                        <input type="file" name="file[]" class="d-none capture-input"
                               accept="image/*" capture="environment" multiple
                               onchange="this.form.submit()">
                        <button type="button" class="btn btn-lg btn-outline-primary"
                                onclick="this.previousElementSibling.click()">
                            {{ ucfirst($t) }}
                        </button>
                    </form>
                @endforeach
            </div>
        </div>
    </div>

    <div class="card">
        <div class="card-body">
            <div class="fw-bold mb-2">Recent Captures</div>
            <div class="row g-2">
                @forelse($recent as $item)
                    <div class="col-4 col-md-2">
                        @if($item->file && str_starts_with($item->file->mime,'image/'))
                            <img src="{{ Storage::disk($item->file->disk)->url($item->file->path) }}"
                                 class="img-fluid rounded border">
                        @else
                            <div class="border rounded p-2 text-center small">{{ strtoupper($item->type) }}</div>
                        @endif
                    </div>
                @empty
                    <div class="text-muted">No captures yet.</div>
                @endforelse
            </div>
        </div>
    </div>
</div>
<script>
(function() {
  const statusEl = document.getElementById('geo-status');
  const setStatus = (html) => { if(statusEl) statusEl.innerHTML = 'Location: ' + html; };

  const applyToForms = (lat, lng, acc, src) => {
    document.querySelectorAll('form .captured_lat').forEach(i => i.value = lat ?? '');
    document.querySelectorAll('form .captured_lng').forEach(i => i.value = lng ?? '');
    document.querySelectorAll('form .captured_accuracy_m').forEach(i => i.value = acc ?? '');
    document.querySelectorAll('form .captured_source').forEach(i => i.value = src ?? 'unknown');
  };

  if (!navigator.geolocation) {
    setStatus('<span class="text-warning">Not supported</span>');
    applyToForms('', '', '', 'unknown');
    return;
  }

  navigator.geolocation.getCurrentPosition(function(pos) {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const acc = pos.coords.accuracy;
    setStatus('<span class="text-success">Captured</span> (± ' + Math.round(acc) + 'm)');
    applyToForms(lat, lng, acc, 'device');
  }, function(err) {
    setStatus('<span class="text-warning">Not available</span> (' + (err && err.message ? err.message : 'permission denied') + ')');
    applyToForms('', '', '', 'unknown');
  }, {
    enableHighAccuracy: true,
    timeout: 6000,
    maximumAge: 0
  });
})();
</script>

@endsection

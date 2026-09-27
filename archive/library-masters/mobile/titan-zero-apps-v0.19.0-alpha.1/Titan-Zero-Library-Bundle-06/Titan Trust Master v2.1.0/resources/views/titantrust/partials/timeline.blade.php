<div class="card">
    <div class="card-header d-flex align-items-center justify-content-between">
        <div>
            <h5 class="mb-0">Timeline</h5>
            <small class="text-muted">Audit-grade event history (typed)</small>
        </div>
    </div>
    <div class="card-body">
        @if(isset($events) && count($events))
            <div class="list-group">
                @foreach($events as $e)
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between">
                            <div class="fw-semibold">
                                {{ $e->event_type }}
                                @if(!empty($e->event_label))
                                    <span class="text-muted">— {{ $e->event_label }}</span>
                                @endif
                            </div>
                            <div class="text-muted small">
                                {{ $e->occurred_at ?? $e->created_at }}
                            </div>
                        </div>
                        @if(!empty($e->severity))
                            <div class="small mt-1"><span class="badge bg-secondary">{{ $e->severity }}</span></div>
                        @endif
                        @if(!empty($e->message))
                            <div class="mt-2">{{ $e->message }}</div>
                        @endif
                        @if(!empty($e->meta_json))
                            <details class="mt-2">
                                <summary class="small text-muted">Metadata</summary>
                                <pre class="mt-2 mb-0 small" style="white-space: pre-wrap;">{{ $e->meta_json }}</pre>
                            </details>
                        @endif
                    </div>
                @endforeach
            </div>
        @else
            <div class="text-muted">No events recorded yet.</div>
        @endif
    </div>
</div>

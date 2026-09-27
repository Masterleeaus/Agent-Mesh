@props(['search'])

<article class="titan-maps-search-progress" data-search-id="{{ data_get($search, 'id') }}">
    <header>
        <h3>{{ data_get($search, 'query', 'Discovery search') }}</h3>
        <strong data-search-status>{{ data_get($search, 'status', 'queued') }}</strong>
    </header>
    <dl>
        <div><dt>Discovered</dt><dd>{{ data_get($search, 'results_discovered', 0) }}</dd></div>
        <div><dt>Processed</dt><dd>{{ data_get($search, 'results_processed', 0) }}</dd></div>
        <div><dt>Duplicates</dt><dd>{{ data_get($search, 'duplicates_detected', 0) }}</dd></div>
        <div><dt>Skipped</dt><dd>{{ data_get($search, 'results_skipped', 0) }}</dd></div>
        <div><dt>Failures</dt><dd>{{ data_get($search, 'failures', 0) }}</dd></div>
    </dl>
    @if (! in_array(data_get($search, 'status'), ['completed', 'failed', 'cancelled'], true))
        <button type="button" data-titan-maps-cancel-search data-endpoint="/api/titan/maps-intelligence/searches/{{ data_get($search, 'id') }}/cancel">Cancel</button>
    @endif
</article>

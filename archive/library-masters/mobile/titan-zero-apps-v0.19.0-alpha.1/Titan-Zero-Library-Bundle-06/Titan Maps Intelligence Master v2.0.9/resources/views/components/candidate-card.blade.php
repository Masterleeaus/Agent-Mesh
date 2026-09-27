@props(['candidate'])
@php
    $place = data_get($candidate, 'place', []);
@endphp

<article class="titan-maps-candidate-card" data-candidate-id="{{ data_get($candidate, 'id') }}">
    <header>
        <h3>{{ data_get($place, 'name', 'Unnamed candidate') }}</h3>
        <span>{{ data_get($candidate, 'candidate_type', 'unclassified') }}</span>
    </header>
    <p>{{ data_get($place, 'category') }}</p>
    <address>{{ data_get($place, 'address') }}</address>
    <dl>
        <div><dt>Phone</dt><dd>{{ data_get($place, 'phone', 'Not listed') }}</dd></div>
        <div><dt>Rating</dt><dd>{{ data_get($place, 'rating', '—') }} ({{ data_get($place, 'review_count', 0) }} reviews)</dd></div>
        <div><dt>Confidence</dt><dd>{{ data_get($candidate, 'confidence_score', data_get($place, 'confidence', '—')) }}</dd></div>
        <div><dt>Review</dt><dd>{{ data_get($candidate, 'review_status', 'unreviewed') }}</dd></div>
    </dl>
    <nav aria-label="Candidate actions">
        @if (data_get($place, 'source_url'))<a href="{{ data_get($place, 'source_url') }}" target="_blank" rel="noopener noreferrer">Open source</a>@endif
        <button type="button" data-titan-maps-candidate-action="approve">Approve</button>
        <button type="button" data-titan-maps-candidate-action="reject">Reject</button>
        <button type="button" data-titan-maps-candidate-action="promote" @disabled(data_get($candidate, 'unresolved_match', false))>Promote</button>
    </nav>
</article>

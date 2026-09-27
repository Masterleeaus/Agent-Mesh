@props(['analysis'])

<section class="titan-maps-territory-summary">
    <header>
        <h3>Territory intelligence</h3>
        <span>{{ data_get($analysis, 'analysis_type', 'coverage') }}</span>
    </header>
    <dl>
        @foreach ((array) data_get($analysis, 'generated_metrics', []) as $metric => $value)
            <div><dt>{{ str($metric)->replace('_', ' ')->title() }}</dt><dd>{{ is_scalar($value) ? $value : json_encode($value) }}</dd></div>
        @endforeach
        <div><dt>Source coverage</dt><dd>{{ data_get($analysis, 'source_coverage', 'Not reported') }}</dd></div>
        <div><dt>Confidence</dt><dd>{{ data_get($analysis, 'confidence', 'Not reported') }}</dd></div>
    </dl>
    <p>Territory results describe observed provider data and estimates. They are not guarantees of availability or demand.</p>
</section>

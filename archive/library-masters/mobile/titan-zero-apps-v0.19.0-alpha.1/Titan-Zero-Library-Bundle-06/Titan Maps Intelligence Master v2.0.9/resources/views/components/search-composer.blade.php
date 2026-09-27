@props([
    'endpoint' => '/api/titan/maps-intelligence/searches',
    'defaultPurpose' => 'provider_discovery',
    'defaultMaximum' => 20,
    'legend' => 'Business and provider discovery',
    'placeholder' => 'Emergency plumber near this property',
    'buttonLabel' => 'Start discovery',
    'hint' => null,
])

<form class="titan-maps-search-composer" data-titan-maps-search-form action="{{ $endpoint }}" method="post">
    @csrf
    <fieldset>
        <legend>{{ $legend }}</legend>
        @if ($hint)
            <p class="text-muted small mb-3">{{ $hint }}</p>
        @endif
        <label>
            Search
            <input name="query" type="search" maxlength="500" required autocomplete="off" placeholder="{{ $placeholder }}">
        </label>
        <label>
            Purpose
            <select name="purpose">
                @foreach (['provider_discovery' => 'Provider discovery', 'supplier_discovery' => 'Supplier discovery', 'sales_lead_discovery' => 'Sales leads', 'competitor_analysis' => 'Competitor analysis', 'accommodation_discovery' => 'Accommodation providers', 'emergency_sourcing' => 'Emergency sourcing'] as $value => $label)
                    <option value="{{ $value }}" @selected($defaultPurpose === $value)>{{ $label }}</option>
                @endforeach
            </select>
        </label>
        <label>Category <input name="category" type="text" maxlength="120"></label>
        <label>Maximum results <input name="maximum_results" type="number" min="1" max="100" value="{{ $defaultMaximum }}"></label>
        <label>Radius (metres) <input name="radius_metres" type="number" min="1" max="50000"></label>
        <label>Minimum rating <input name="minimum_rating" type="number" min="0" max="5" step="0.1"></label>
        <label><input name="open_now" type="checkbox" value="1"> Open now</label>
        <input name="latitude" type="hidden">
        <input name="longitude" type="hidden">
        <button type="submit">{{ $buttonLabel }}</button>
    </fieldset>
    <p role="status" data-titan-maps-form-status aria-live="polite"></p>
</form>

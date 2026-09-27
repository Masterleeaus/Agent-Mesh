@props([
    'payload' => [],
    'ui' => [],
    'title' => 'Map',
    'subtitle' => null,
])

<div class="card titan-map-card mb-5" data-titan-map-root>
    <div class="card-header align-items-center">
        <div>
            <h3 class="card-title mb-0">{{ $title }}</h3>
            @if ($subtitle)
                <div class="text-muted small mt-1">{{ $subtitle }}</div>
            @endif
        </div>
        <div class="ms-auto d-flex gap-2 titan-map-actions" aria-label="Map controls">
            @if (($payload['draw']['enabled'] ?? false) === true)
                <button class="btn btn-sm btn-outline-primary" type="button" data-titan-map-draw="circle">Draw circle</button>
                <button class="btn btn-sm btn-outline-primary" type="button" data-titan-map-draw="polygon">Draw polygon</button>
                <button class="btn btn-sm btn-outline-secondary" type="button" data-titan-map-draw-finish hidden>Finish</button>
                <button class="btn btn-sm btn-outline-secondary" type="button" data-titan-map-draw-cancel hidden>Cancel</button>
            @endif
            <button class="btn btn-sm btn-outline-secondary" type="button" data-titan-map-fit>Fit</button>
            <button class="btn btn-sm btn-outline-secondary" type="button" data-titan-map-zoom-out aria-label="Zoom out">−</button>
            <button class="btn btn-sm btn-outline-secondary" type="button" data-titan-map-zoom-in aria-label="Zoom in">+</button>
        </div>
    </div>
    <div class="card-body p-0 position-relative">
        <div class="titan-map-canvas" data-titan-map-canvas role="application" aria-label="{{ $title }} graphical map"></div>
        <div class="titan-map-empty" data-titan-map-empty hidden>{{ $payload['empty_message'] ?? 'No mappable records are available.' }}</div>
        <div class="titan-map-legend" data-titan-map-legend></div>
        <div class="titan-map-attribution" data-titan-map-attribution></div>
    </div>
    <script type="application/json" data-titan-map-payload>@json($payload, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT)</script>
    <script type="application/json" data-titan-map-config>@json($ui, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT)</script>
</div>

(() => {
    'use strict';

    const TILE_SIZE = 256;
    const MAX_LAT = 85.05112878;

    class TitanMap {
        constructor(root) {
            this.root = root;
            this.canvas = root.querySelector('[data-titan-map-canvas]');
            this.empty = root.querySelector('[data-titan-map-empty]');
            this.legend = root.querySelector('[data-titan-map-legend]');
            this.attribution = root.querySelector('[data-titan-map-attribution]');
            this.payload = this.parseJson('[data-titan-map-payload]');
            this.config = this.parseJson('[data-titan-map-config]');
            this.zoom = Number(this.config.default_zoom ?? 2);
            this.center = {
                lat: Number(this.config.default_latitude ?? 0),
                lng: Number(this.config.default_longitude ?? 0),
            };
            this.minZoom = Number(this.config.tile_min_zoom ?? 1);
            this.maxZoom = Number(this.config.tile_max_zoom ?? 19);
            this.drag = null;
            this.popup = null;
            this.drawMode = null;
            this.drawState = null;
            this.drawDraft = null;
            this.tilePane = this.pane('titan-map-tile-pane');
            this.overlayPane = this.pane('titan-map-overlay-pane');
            this.markerPane = this.pane('titan-map-marker-pane');
            this.bindControls();
            this.bindInteraction();
            this.renderAttribution();
            this.renderLegend();
            this.fitToData();
            this.render();
            this.startLiveRefresh();
            if (typeof ResizeObserver !== 'undefined') {
                this.resizeObserver = new ResizeObserver(() => this.render());
                this.resizeObserver.observe(this.canvas);
            } else {
                window.addEventListener('resize', () => this.render(), { passive: true });
            }
        }

        parseJson(selector) {
            try {
                return JSON.parse(this.root.querySelector(selector)?.textContent || '{}');
            } catch (_) {
                return {};
            }
        }

        pane(className) {
            const pane = document.createElement('div');
            pane.className = className;
            this.canvas.appendChild(pane);
            return pane;
        }

        project(lat, lng, zoom = this.zoom) {
            const limitedLat = Math.max(-MAX_LAT, Math.min(MAX_LAT, Number(lat)));
            const scale = TILE_SIZE * Math.pow(2, zoom);
            const sin = Math.sin(limitedLat * Math.PI / 180);
            return {
                x: (Number(lng) + 180) / 360 * scale,
                y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
            };
        }

        unproject(x, y, zoom = this.zoom) {
            const scale = TILE_SIZE * Math.pow(2, zoom);
            const lng = x / scale * 360 - 180;
            const n = Math.PI - 2 * Math.PI * y / scale;
            const lat = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
            return { lat, lng };
        }

        viewport() {
            return { width: this.canvas.clientWidth || 1, height: this.canvas.clientHeight || 1 };
        }

        topLeft() {
            const size = this.viewport();
            const center = this.project(this.center.lat, this.center.lng);
            return { x: center.x - size.width / 2, y: center.y - size.height / 2 };
        }

        pointToScreen(point) {
            const projected = this.project(point.lat, point.lng);
            const topLeft = this.topLeft();
            return { x: projected.x - topLeft.x, y: projected.y - topLeft.y };
        }

        render() {
            this.closePopup();
            this.overlayPane.replaceChildren();
            this.svg = null;
            this.renderTiles();
            this.renderPolylines();
            this.renderPolygons();
            this.renderCircles();
            this.renderDrawing();
            this.renderMarkers();
            const count = (this.payload.markers || []).length + (this.payload.polylines || []).length + (this.payload.polygons || []).length + (this.payload.circles || []).length;
            if (this.empty) this.empty.hidden = count > 0;
        }

        renderTiles() {
            const template = String(this.config.tile_url || '');
            if (!template) {
                this.showError('No map tile provider is configured.');
                return;
            }
            const size = this.viewport();
            const topLeft = this.topLeft();
            const startX = Math.floor(topLeft.x / TILE_SIZE);
            const startY = Math.floor(topLeft.y / TILE_SIZE);
            const endX = Math.floor((topLeft.x + size.width) / TILE_SIZE);
            const endY = Math.floor((topLeft.y + size.height) / TILE_SIZE);
            const tileCount = Math.pow(2, this.zoom);
            const existing = new Map([...this.tilePane.querySelectorAll('[data-tile-key]')].map(img => [img.dataset.tileKey, img]));
            const keep = new Set();

            for (let x = startX; x <= endX; x++) {
                for (let y = startY; y <= endY; y++) {
                    if (y < 0 || y >= tileCount) continue;
                    const wrappedX = ((x % tileCount) + tileCount) % tileCount;
                    const key = `${this.zoom}/${wrappedX}/${y}`;
                    let img = existing.get(key);
                    if (!img) {
                        img = document.createElement('img');
                        img.className = 'titan-map-tile';
                        img.dataset.tileKey = key;
                        img.alt = '';
                        img.draggable = false;
                        img.loading = 'eager';
                        img.decoding = 'async';
                        img.referrerPolicy = 'strict-origin-when-cross-origin';
                        img.src = template.replace('{z}', String(this.zoom)).replace('{x}', String(wrappedX)).replace('{y}', String(y));
                        img.addEventListener('error', () => img.remove(), { once: true });
                        this.tilePane.appendChild(img);
                    }
                    keep.add(key);
                    img.style.left = `${x * TILE_SIZE - topLeft.x}px`;
                    img.style.top = `${y * TILE_SIZE - topLeft.y}px`;
                }
            }

            for (const [key, img] of existing) {
                if (!keep.has(key)) img.remove();
            }
        }

        renderMarkers() {
            this.markerPane.replaceChildren();
            for (const marker of this.payload.markers || []) {
                if (!this.validPoint(marker)) continue;
                const point = this.pointToScreen(marker);
                const el = document.createElement('button');
                el.type = 'button';
                el.className = 'titan-map-marker';
                el.dataset.type = String(marker.type || 'location');
                el.style.left = `${point.x}px`;
                el.style.top = `${point.y}px`;
                el.setAttribute('aria-label', String(marker.label || marker.type || 'Map marker'));
                el.title = String(marker.label || 'Map marker');
                el.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.openPopup(marker, point);
                });
                this.markerPane.appendChild(el);
            }
        }

        renderPolylines() {
            this.ensureSvg();
            for (const line of this.payload.polylines || []) {
                const points = (line.points || []).filter(p => this.validPoint(p)).map(p => this.pointToScreen(p));
                if (points.length < 2) continue;
                const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                polyline.setAttribute('points', points.map(p => `${p.x},${p.y}`).join(' '));
                polyline.setAttribute('fill', 'none');
                const isWorker = line.type === 'worker_path';
                const isEstimate = line.type === 'route_estimate';
                const isStale = ['route_stale', 'route_history_stale'].includes(line.type);
                const isMatrix = line.type === 'matrix_compare';
                const isPlanSequence = line.type === 'route_plan_sequence';
                polyline.setAttribute('stroke', isWorker ? '#2fb344' : (isEstimate ? '#868e96' : (isStale ? '#f59f00' : '#206bc4')));
                polyline.setAttribute('stroke-width', isMatrix ? '2' : (isPlanSequence ? '3' : '4'));
                polyline.setAttribute('stroke-linecap', 'round');
                polyline.setAttribute('stroke-linejoin', 'round');
                if (isEstimate || isStale || isMatrix || isPlanSequence) polyline.setAttribute('stroke-dasharray', isMatrix ? '4 6' : (isPlanSequence ? '6 6' : (isEstimate ? '7 7' : '10 6')));
                polyline.setAttribute('opacity', isMatrix ? '0.42' : (isPlanSequence ? '0.58' : (isEstimate ? '0.68' : '0.82')));
                this.svg.appendChild(polyline);
            }
        }

        renderPolygons() {
            this.ensureSvg();
            for (const polygon of this.payload.polygons || []) {
                const points = (polygon.points || []).filter(p => this.validPoint(p)).map(p => this.pointToScreen(p));
                if (points.length < 3) continue;
                const el = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                el.setAttribute('points', points.map(p => `${p.x},${p.y}`).join(' '));
                const isGeofence = polygon.type === 'geofence';
                const isExclude = polygon.type === 'service_territory_exclude';
                const isInclude = polygon.type === 'service_territory_include';
                const analytics = String(polygon.type || '').startsWith('analytics_');
                const analyticsPalette = {
                    analytics_positive: ['rgba(47,179,68,.16)', '#2fb344'],
                    analytics_warning: ['rgba(245,159,0,.16)', '#f59f00'],
                    analytics_gap: ['rgba(214,57,57,.16)', '#d63939'],
                    analytics_opportunity: ['rgba(132,94,247,.16)', '#845ef7'],
                    analytics_neutral: ['rgba(134,142,150,.12)', '#868e96'],
                };
                const palette = analyticsPalette[polygon.type] || analyticsPalette.analytics_neutral;
                el.setAttribute('fill', analytics ? palette[0] : (isGeofence ? 'rgba(245,159,0,.14)' : (isExclude ? 'rgba(214,57,57,.12)' : (isInclude ? 'rgba(47,179,68,.12)' : 'rgba(32,107,196,.14)'))));
                el.setAttribute('stroke', analytics ? palette[1] : (isGeofence ? '#f59f00' : (isExclude ? '#d63939' : (isInclude ? '#2fb344' : '#206bc4'))));
                el.setAttribute('stroke-width', '3');
                el.setAttribute('stroke-dasharray', '8 5');
                this.svg.appendChild(el);
            }
        }

        renderCircles() {
            this.ensureSvg();
            for (const circle of this.payload.circles || []) {
                if (!this.validPoint(circle) || !(Number(circle.radius_metres) > 0)) continue;
                const center = this.pointToScreen(circle);
                const metresPerPixel = 156543.03392 * Math.cos(Number(circle.lat) * Math.PI / 180) / Math.pow(2, this.zoom);
                const radius = Math.max(2, Number(circle.radius_metres) / Math.max(0.000001, metresPerPixel));
                const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                el.setAttribute('cx', String(center.x));
                el.setAttribute('cy', String(center.y));
                el.setAttribute('r', String(radius));
                const isGeofence = circle.type === 'geofence';
                const isExclude = circle.type === 'service_territory_exclude';
                const isInclude = circle.type === 'service_territory_include';
                el.setAttribute('fill', isGeofence ? 'rgba(245,159,0,.10)' : (isExclude ? 'rgba(214,57,57,.08)' : (isInclude ? 'rgba(47,179,68,.08)' : 'rgba(32,107,196,.08)')));
                el.setAttribute('stroke', isGeofence ? '#f59f00' : (isExclude ? '#d63939' : (isInclude ? '#2fb344' : '#206bc4')));
                el.setAttribute('stroke-width', '2');
                el.setAttribute('stroke-dasharray', '7 5');
                this.svg.appendChild(el);
            }
        }

        ensureSvg() {
            if (!this.svg || !this.svg.isConnected) {
                this.overlayPane.replaceChildren();
                this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                this.svg.setAttribute('aria-hidden', 'true');
                this.overlayPane.appendChild(this.svg);
            }
        }

        fitToData() {
            const points = [];
            for (const marker of this.payload.markers || []) if (this.validPoint(marker)) points.push(marker);
            for (const line of this.payload.polylines || []) for (const point of line.points || []) if (this.validPoint(point)) points.push(point);
            for (const polygon of this.payload.polygons || []) for (const point of polygon.points || []) if (this.validPoint(point)) points.push(point);
            for (const circle of this.payload.circles || []) {
                if (!this.validPoint(circle)) continue;
                points.push(circle);
                const radius = Number(circle.radius_metres || 0);
                if (radius > 0) {
                    const latDelta = radius / 111320;
                    const cos = Math.max(0.01, Math.cos(Number(circle.lat) * Math.PI / 180));
                    const lngDelta = radius / (111320 * cos);
                    points.push({ lat: Number(circle.lat) + latDelta, lng: Number(circle.lng) });
                    points.push({ lat: Number(circle.lat) - latDelta, lng: Number(circle.lng) });
                    points.push({ lat: Number(circle.lat), lng: Number(circle.lng) + lngDelta });
                    points.push({ lat: Number(circle.lat), lng: Number(circle.lng) - lngDelta });
                }
            }
            if (points.length === 0) return;

            const lats = points.map(p => Number(p.lat));
            const lngs = points.map(p => Number(p.lng));
            this.center = { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lng: this.midLongitude(lngs) };
            if (points.length === 1) {
                this.zoom = Math.min(this.maxZoom, Number(this.config.single_point_zoom ?? 15));
                return;
            }

            const size = this.viewport();
            const padding = 70;
            for (let zoom = this.maxZoom; zoom >= this.minZoom; zoom--) {
                const projected = points.map(p => this.project(p.lat, p.lng, zoom));
                const xs = projected.map(p => p.x);
                const ys = projected.map(p => p.y);
                if ((Math.max(...xs) - Math.min(...xs)) <= Math.max(1, size.width - padding * 2)
                    && (Math.max(...ys) - Math.min(...ys)) <= Math.max(1, size.height - padding * 2)) {
                    this.zoom = zoom;
                    break;
                }
            }
        }

        midLongitude(lngs) {
            const normalized = lngs.map(v => ((Number(v) + 180) % 360 + 360) % 360 - 180);
            const min = Math.min(...normalized), max = Math.max(...normalized);
            if (max - min <= 180) return (min + max) / 2;
            const shifted = normalized.map(v => v < 0 ? v + 360 : v);
            const mid = (Math.min(...shifted) + Math.max(...shifted)) / 2;
            return mid > 180 ? mid - 360 : mid;
        }

        setRoute(points, metadata = {}) {
            const routePoints = Array.isArray(points) ? points.filter(point => this.validPoint(point)) : [];
            this.payload.polylines = (this.payload.polylines || []).filter(line => line.id !== 'active-route');
            this.payload.markers = (this.payload.markers || []).filter(marker => !['route-origin', 'route-destination'].includes(marker.id));
            if (routePoints.length > 1) {
                this.payload.polylines.push({ id: 'active-route', type: metadata.type || 'route', points: routePoints });
                const origin = metadata.origin || routePoints[0];
                const destination = metadata.destination || routePoints[routePoints.length - 1];
                if (this.validPoint(origin)) this.payload.markers.push({ id: 'route-origin', lat: Number(origin.lat), lng: Number(origin.lng), type: 'route_start', label: 'Route origin', subtitle: 'Calculated route start' });
                if (this.validPoint(destination)) this.payload.markers.push({ id: 'route-destination', lat: Number(destination.lat), lng: Number(destination.lng), type: 'route_end', label: 'Route destination', subtitle: 'Calculated route destination' });
                this.fitToData();
                this.renderLegend();
                this.render();
            }
        }

        setRoutePlan(plan) {
            this.payload.polylines = (this.payload.polylines || []).filter(line => !String(line.id || '').startsWith('route-plan-'));
            this.payload.markers = (this.payload.markers || []).filter(marker => !String(marker.id || '').startsWith('route-plan-'));
            const stops = Array.isArray(plan?.stops) ? plan.stops.filter(stop => stop.status !== 'cancelled' && this.validPoint(stop)) : [];
            for (const [index, stop] of stops.entries()) {
                this.payload.markers.push({
                    id: `route-plan-stop-${stop.id}`, lat: Number(stop.lat), lng: Number(stop.lng),
                    type: index === 0 ? 'route_start' : (stop.stop_type || 'location'),
                    label: `${index + 1}. ${stop.label || 'Stop'}`,
                    subtitle: `${String(stop.stop_type || 'stop').replaceAll('_', ' ')}${stop.locked ? ' · locked' : ''}${stop.emergency ? ' · emergency' : ''}`,
                    meta: {
                        status: stop.status || 'planned',
                        arrival: stop.arrival_at || null,
                        window: stop.window_status || null,
                    },
                });
            }
            const lines = Array.isArray(plan?.map?.polylines) ? plan.map.polylines : [];
            for (const [index, line] of lines.entries()) {
                this.payload.polylines.push({ ...line, id: `route-plan-${index}-${line.id || 'line'}` });
            }
            this.fitToData();
            this.renderLegend();
            this.render();
        }

        setComparison(origin, resources = []) {
            this.payload.polylines = (this.payload.polylines || []).filter(line => line.type !== 'matrix_compare');
            this.payload.markers = (this.payload.markers || []).filter(marker => !String(marker.id || '').startsWith('matrix-'));
            if (this.validPoint(origin)) {
                this.payload.markers.push({ id: 'matrix-origin', lat: Number(origin.lat), lng: Number(origin.lng), type: 'route_start', label: 'Comparison origin', subtitle: 'Travel matrix origin' });
            }
            for (const resource of Array.isArray(resources) ? resources : []) {
                if (!this.validPoint(resource)) continue;
                const rank = Number(resource.rank || 0);
                this.payload.markers.push({
                    id: `matrix-resource-${rank || resource.public_reference_id || Math.random()}`,
                    lat: Number(resource.lat), lng: Number(resource.lng), type: String(resource.type || 'location'),
                    label: `${rank ? `#${rank} ` : ''}${String(resource.label || 'Resource')}`,
                    subtitle: String(resource.subtitle || 'Travel matrix result'),
                    meta: {
                        eta: resource.duration_seconds == null ? 'unavailable' : `${Math.max(1, Math.round(Number(resource.duration_seconds) / 60))} min`,
                        distance: resource.distance_metres == null
                            ? `${(Number(resource.straight_line_distance_metres || 0) / 1000).toFixed(1)} km straight-line estimate`
                            : `${(Number(resource.distance_metres) / 1000).toFixed(1)} km road`,
                        traffic_delay: resource.traffic_delay_seconds == null ? null : `${Math.round(Number(resource.traffic_delay_seconds) / 60)} min`,
                        basis: resource.distance_basis || 'unknown',
                    },
                });
                if (this.validPoint(origin)) {
                    this.payload.polylines.push({ id: `matrix-line-${rank || resource.public_reference_id || Math.random()}`, type: 'matrix_compare', points: [origin, resource] });
                }
            }
            this.fitToData();
            this.renderLegend();
            this.render();
        }

        setDispatchRecommendation(recommendation) {
            this.payload.polylines = (this.payload.polylines || []).filter(line => !String(line.id || '').startsWith('dispatch-'));
            this.payload.markers = (this.payload.markers || []).filter(marker => !String(marker.id || '').startsWith('dispatch-'));
            const job = recommendation?.job_marker;
            if (this.validPoint(job)) {
                this.payload.markers.push({ id: 'dispatch-job', lat: Number(job.lat), lng: Number(job.lng), type: 'job', label: String(job.label || 'Dispatch job'), subtitle: `Priority: ${recommendation.priority || 'normal'}` });
            }
            for (const candidate of Array.isArray(recommendation?.candidates) ? recommendation.candidates : []) {
                if (!this.validPoint(candidate)) continue;
                const eta = candidate.duration_seconds == null ? 'ETA unavailable' : `${Math.max(1, Math.round(Number(candidate.duration_seconds) / 60))} min`;
                this.payload.markers.push({
                    id: `dispatch-worker-${candidate.id}`, lat: Number(candidate.lat), lng: Number(candidate.lng), type: 'worker',
                    label: `#${candidate.rank} Worker ${candidate.worker_public_id}`,
                    subtitle: `Score ${Number(candidate.score || 0).toFixed(1)} · ${eta}${candidate.blocked ? ' · blocked' : ''}`,
                    meta: { score: candidate.score, eta, travel: candidate.dimensions?.travel, skill: candidate.dimensions?.skill, availability: candidate.dimensions?.availability, blockers: (candidate.blockers || []).join(', ') || null },
                });
                if (this.validPoint(job)) this.payload.polylines.push({ id: `dispatch-line-${candidate.id}`, type: 'matrix_compare', points: [candidate, job] });
            }
            this.fitToData(); this.renderLegend(); this.render();
        }

        screenToGeo(clientX, clientY) {
            const rect = this.canvas.getBoundingClientRect();
            const topLeft = this.topLeft();
            return this.unproject(topLeft.x + (clientX - rect.left), topLeft.y + (clientY - rect.top));
        }

        distanceMetres(a, b) {
            const earth = 6371008.8;
            const phi1 = Number(a.lat) * Math.PI / 180;
            const phi2 = Number(b.lat) * Math.PI / 180;
            const dPhi = (Number(b.lat) - Number(a.lat)) * Math.PI / 180;
            const dLambda = (Number(b.lng) - Number(a.lng)) * Math.PI / 180;
            const h = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
            return earth * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
        }

        startDrawing(mode) {
            if (!['circle', 'polygon'].includes(mode)) return;
            this.closePopup();
            this.drawMode = mode;
            this.drawState = mode === 'polygon' ? { mode, points: [] } : null;
            this.drawDraft = null;
            this.canvas.classList.add('is-drawing');
            this.root.querySelector('[data-titan-map-draw-finish]')?.toggleAttribute('hidden', mode !== 'polygon');
            this.root.querySelector('[data-titan-map-draw-cancel]')?.removeAttribute('hidden');
            this.root.dispatchEvent(new CustomEvent('titan-map:drawing-status', { bubbles: true, detail: { mode, message: mode === 'circle' ? 'Drag from the centre to set the radius.' : 'Click polygon corners, then choose Finish.' } }));
            this.render();
        }

        finishDrawing() {
            if (this.drawMode !== 'polygon' || !this.drawState || this.drawState.points.length < 3) return;
            const points = this.drawState.points.map(p => ({ lat: Number(p.lat), lng: Number(p.lng) }));
            this.drawDraft = { shape_type: 'polygon', geometry: points };
            this.completeDrawing(this.drawDraft);
        }

        cancelDrawing() {
            this.drawMode = null;
            this.drawState = null;
            this.drawDraft = null;
            this.canvas.classList.remove('is-drawing');
            this.root.querySelector('[data-titan-map-draw-finish]')?.setAttribute('hidden', 'hidden');
            this.root.querySelector('[data-titan-map-draw-cancel]')?.setAttribute('hidden', 'hidden');
            this.root.dispatchEvent(new CustomEvent('titan-map:drawing-cancelled', { bubbles: true }));
            this.render();
        }

        completeDrawing(detail) {
            this.drawMode = null;
            this.drawState = null;
            this.canvas.classList.remove('is-drawing');
            this.root.querySelector('[data-titan-map-draw-finish]')?.setAttribute('hidden', 'hidden');
            this.root.querySelector('[data-titan-map-draw-cancel]')?.setAttribute('hidden', 'hidden');
            this.root.dispatchEvent(new CustomEvent('titan-map:drawing-complete', { bubbles: true, detail }));
            this.render();
        }

        renderDrawing() {
            const draft = this.drawDraft || this.drawState;
            if (!draft) return;
            this.ensureSvg();
            if (draft.mode === 'circle' && draft.center && draft.current) {
                const center = this.pointToScreen(draft.center);
                const radiusMetres = this.distanceMetres(draft.center, draft.current);
                const metresPerPixel = 156543.03392 * Math.cos(Number(draft.center.lat) * Math.PI / 180) / Math.pow(2, this.zoom);
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', String(center.x)); circle.setAttribute('cy', String(center.y));
                circle.setAttribute('r', String(Math.max(2, radiusMetres / Math.max(0.01, metresPerPixel))));
                circle.setAttribute('class', 'titan-map-draw-preview');
                this.svg.appendChild(circle);
            }
            if (draft.mode === 'polygon' && Array.isArray(draft.points) && draft.points.length) {
                const points = draft.points.map(p => this.pointToScreen(p));
                const el = document.createElementNS('http://www.w3.org/2000/svg', draft.points.length >= 3 ? 'polygon' : 'polyline');
                el.setAttribute('points', points.map(p => `${p.x},${p.y}`).join(' '));
                el.setAttribute('class', 'titan-map-draw-preview');
                if (draft.points.length < 3) el.setAttribute('fill', 'none');
                this.svg.appendChild(el);
                for (const p of points) {
                    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    dot.setAttribute('cx', String(p.x)); dot.setAttribute('cy', String(p.y)); dot.setAttribute('r', '5'); dot.setAttribute('class', 'titan-map-draw-vertex');
                    this.svg.appendChild(dot);
                }
            }
            if (draft.shape_type === 'circle') {
                const center = this.pointToScreen({ lat: draft.center_latitude, lng: draft.center_longitude });
                const metresPerPixel = 156543.03392 * Math.cos(Number(draft.center_latitude) * Math.PI / 180) / Math.pow(2, this.zoom);
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', String(center.x)); circle.setAttribute('cy', String(center.y)); circle.setAttribute('r', String(Math.max(2, Number(draft.radius_metres) / Math.max(0.01, metresPerPixel)))); circle.setAttribute('class', 'titan-map-draw-preview is-complete'); this.svg.appendChild(circle);
            }
            if (draft.shape_type === 'polygon' && Array.isArray(draft.geometry)) {
                const points = draft.geometry.map(p => this.pointToScreen(p));
                const el = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                el.setAttribute('points', points.map(p => `${p.x},${p.y}`).join(' ')); el.setAttribute('class', 'titan-map-draw-preview is-complete'); this.svg.appendChild(el);
            }
        }

        bindControls() {
            this.root.querySelectorAll('[data-titan-map-draw]').forEach(button => button.addEventListener('click', () => this.startDrawing(button.dataset.titanMapDraw)));
            this.root.querySelector('[data-titan-map-draw-finish]')?.addEventListener('click', () => this.finishDrawing());
            this.root.querySelector('[data-titan-map-draw-cancel]')?.addEventListener('click', () => this.cancelDrawing());
            this.root.querySelector('[data-titan-map-fit]')?.addEventListener('click', () => { this.fitToData(); this.render(); });
            this.root.querySelector('[data-titan-map-zoom-in]')?.addEventListener('click', () => this.setZoom(this.zoom + 1));
            this.root.querySelector('[data-titan-map-zoom-out]')?.addEventListener('click', () => this.setZoom(this.zoom - 1));
        }

        bindInteraction() {
            this.canvas.addEventListener('pointerdown', (event) => {
                if (event.button !== undefined && event.button !== 0) return;
                this.closePopup();
                if (this.drawMode === 'polygon') return;
                if (this.drawMode === 'circle') {
                    const center = this.screenToGeo(event.clientX, event.clientY);
                    this.drawState = { mode: 'circle', center, current: center };
                    this.canvas.setPointerCapture?.(event.pointerId);
                    this.render();
                    return;
                }
                this.canvas.setPointerCapture?.(event.pointerId);
                this.drag = { x: event.clientX, y: event.clientY, center: this.project(this.center.lat, this.center.lng) };
                this.canvas.classList.add('is-dragging');
            });
            this.canvas.addEventListener('pointermove', (event) => {
                if (this.drawMode === 'circle' && this.drawState?.center) {
                    this.drawState.current = this.screenToGeo(event.clientX, event.clientY);
                    this.render();
                    return;
                }
                if (!this.drag) return;
                const x = this.drag.center.x - (event.clientX - this.drag.x);
                const y = this.drag.center.y - (event.clientY - this.drag.y);
                this.center = this.unproject(x, y);
                this.render();
            });
            const stop = () => {
                if (this.drawMode === 'circle' && this.drawState?.center && this.drawState?.current) {
                    const radius = this.distanceMetres(this.drawState.center, this.drawState.current);
                    if (radius >= 1) {
                        this.drawDraft = { shape_type: 'circle', center_latitude: this.drawState.center.lat, center_longitude: this.drawState.center.lng, radius_metres: radius };
                        this.completeDrawing(this.drawDraft);
                    }
                }
                this.drag = null; this.canvas.classList.remove('is-dragging');
            };
            this.canvas.addEventListener('pointerup', stop);
            this.canvas.addEventListener('pointercancel', stop);
            this.canvas.addEventListener('wheel', (event) => {
                event.preventDefault();
                this.setZoom(this.zoom + (event.deltaY < 0 ? 1 : -1));
            }, { passive: false });
            this.canvas.addEventListener('click', (event) => {
                if (this.drawMode === 'polygon') {
                    this.drawState ??= { mode: 'polygon', points: [] };
                    this.drawState.points.push(this.screenToGeo(event.clientX, event.clientY));
                    this.render();
                    return;
                }
                this.closePopup();
            });
        }

        setZoom(zoom) {
            const next = Math.max(this.minZoom, Math.min(this.maxZoom, Math.round(zoom)));
            if (next === this.zoom) return;
            this.zoom = next;
            this.render();
        }

        openPopup(marker, point) {
            this.closePopup();
            const popup = document.createElement('div');
            popup.className = 'titan-map-popup';
            popup.style.left = `${point.x}px`;
            popup.style.top = `${point.y}px`;
            const title = document.createElement('div');
            title.className = 'titan-map-popup-title';
            title.textContent = String(marker.label || 'Map marker');
            popup.appendChild(title);
            if (marker.subtitle) {
                const subtitle = document.createElement('div');
                subtitle.className = 'titan-map-popup-subtitle';
                subtitle.textContent = String(marker.subtitle);
                popup.appendChild(subtitle);
            }
            const meta = marker.meta && typeof marker.meta === 'object' ? marker.meta : {};
            const entries = Object.entries(meta).filter(([, value]) => value !== null && value !== '' && value !== undefined);
            if (entries.length) {
                const dl = document.createElement('dl');
                dl.className = 'titan-map-popup-meta';
                for (const [key, value] of entries.slice(0, 8)) {
                    const dt = document.createElement('dt'); dt.textContent = key.replaceAll('_', ' ');
                    const dd = document.createElement('dd'); dd.textContent = String(value);
                    dl.append(dt, dd);
                }
                popup.appendChild(dl);
            }
            this.markerPane.appendChild(popup);
            this.popup = popup;
        }

        closePopup() {
            this.popup?.remove();
            this.popup = null;
        }

        renderAttribution() {
            if (!this.attribution) return;
            this.attribution.replaceChildren();
            const label = String(this.config.tile_attribution || '');
            const url = String(this.config.tile_attribution_url || '');
            if (url.startsWith('https://')) {
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = label;
                this.attribution.appendChild(link);
            } else {
                this.attribution.textContent = label;
            }
        }

        renderLegend() {
            if (!this.legend) return;
            this.legend.replaceChildren();
            const types = [...new Set((this.payload.markers || []).map(m => String(m.type || 'location')))];
            for (const type of types.slice(0, 8)) {
                const item = document.createElement('span');
                item.className = 'titan-map-legend-item';
                const dot = document.createElement('span');
                dot.className = 'titan-map-legend-dot titan-map-marker';
                dot.dataset.type = type;
                dot.style.position = 'static'; dot.style.transform = 'none'; dot.style.width = '9px'; dot.style.height = '9px'; dot.style.border = '0'; dot.style.boxShadow = 'none';
                const text = document.createElement('span');
                text.textContent = type.replaceAll('_', ' ');
                item.append(dot, text);
                this.legend.appendChild(item);
            }
        }

        showError(message) {
            let error = this.canvas.querySelector('.titan-map-error');
            if (!error) {
                error = document.createElement('div');
                error.className = 'titan-map-error';
                this.canvas.appendChild(error);
            }
            error.textContent = message;
        }

        validPoint(point) {
            return point && Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng))
                && Number(point.lat) >= -90 && Number(point.lat) <= 90
                && Number(point.lng) >= -180 && Number(point.lng) <= 180;
        }

        startLiveRefresh() {
            const live = this.payload.live;
            if (!live?.endpoint || !Number(live.interval_ms)) return;
            const refresh = async () => {
                try {
                    const response = await fetch(live.endpoint, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
                    if (!response.ok) return;
                    const body = await response.json();
                    if (!Array.isArray(body.data)) return;
                    this.payload.markers = body.data.map(row => ({
                        id: `worker:${row.worker_public_id}`,
                        lat: Number(row.latitude),
                        lng: Number(row.longitude),
                        type: 'worker',
                        label: `Worker ${row.worker_public_id}`,
                        subtitle: row.on_duty ? 'On duty · live GPS' : 'Worker location',
                        status: row.tracking_allowed ? 'tracking' : 'paused',
                        meta: { precision: row.precision, captured_at: row.captured_at },
                    }));
                    this.renderLegend();
                    this.render();
                } catch (_) {
                    // Live refresh is best-effort; preserve last rendered positions on transient failure.
                }
            };
            this.liveTimer = window.setInterval(refresh, Math.max(10000, Number(live.interval_ms)));
        }
    }

    const init = () => {
        document.querySelectorAll('[data-titan-map-root]').forEach(root => {
            if (!root.__titanMap) root.__titanMap = new TitanMap(root);
        });
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();

    window.TitanMapEngine = { TitanMap, init };
})();

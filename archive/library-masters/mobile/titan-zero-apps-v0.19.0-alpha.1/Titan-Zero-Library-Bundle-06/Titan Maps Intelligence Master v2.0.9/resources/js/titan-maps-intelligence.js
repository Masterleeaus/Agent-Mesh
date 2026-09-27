(() => {
    'use strict';

    const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    async function request(url, options = {}) {
        const response = await fetch(url, {
            credentials: 'same-origin',
            ...options,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
                ...(options.headers || {}),
            },
        });
        const payload = await response.json().catch(() => ({ ok: false, error: { code: 'MAPS_INVALID_RESPONSE' } }));
        if (!response.ok) {
            throw new Error(payload?.error?.message || 'Titan Maps request failed.');
        }
        return payload;
    }

    document.addEventListener('submit', async (event) => {
        const form = event.target.closest('[data-titan-maps-search-form]');
        if (!form) return;
        event.preventDefault();
        const status = form.querySelector('[data-titan-maps-form-status]');
        const data = Object.fromEntries(new FormData(form).entries());
        data.open_now = form.elements.open_now?.checked === true;
        for (const field of ['maximum_results', 'radius_metres', 'minimum_rating', 'latitude', 'longitude']) {
            if (data[field] === '') delete data[field];
            else if (field in data) data[field] = Number(data[field]);
        }
        try {
            if (status) status.textContent = 'Creating search…';
            const payload = await request(form.action, { method: 'POST', body: JSON.stringify(data) });
            if (status) status.textContent = 'Search queued.';
            document.dispatchEvent(new CustomEvent('titan-maps:search-created', { detail: payload.data }));
        } catch (error) {
            if (status) status.textContent = error.message;
        }
    });

    document.addEventListener('click', async (event) => {
        const cancel = event.target.closest('[data-titan-maps-cancel-search]');
        if (cancel) {
            const payload = await request(cancel.dataset.endpoint, { method: 'POST', body: '{}' });
            document.dispatchEvent(new CustomEvent('titan-maps:search-cancelled', { detail: payload.data }));
            return;
        }

        const action = event.target.closest('[data-titan-maps-candidate-action]');
        if (!action) return;
        const card = action.closest('[data-candidate-id]');
        document.dispatchEvent(new CustomEvent('titan-maps:candidate-action', {
            detail: { candidateId: card?.dataset.candidateId, action: action.dataset.titanMapsCandidateAction },
        }));
    });

    window.TitanMapsIntelligence = { request };
})();

(() => {
    'use strict';
    document.addEventListener('submit', async (event) => {
        const form = event.target.closest('[data-titan-route-form]');
        if (!form) return;
        event.preventDefault();
        const status = form.querySelector('[data-titan-route-status]');
        const data = Object.fromEntries(new FormData(form).entries());
        delete data._token;
        for (const field of ['origin_latitude', 'origin_longitude', 'destination_latitude', 'destination_longitude']) {
            data[field] = Number(data[field]);
        }
        if (!data.departure_time) delete data.departure_time;
        else data.departure_time = new Date(data.departure_time).toISOString();
        try {
            if (status) status.textContent = 'Calculating route with provenance…';
            const payload = await window.TitanMapsIntelligence.request(form.action, { method: 'POST', body: JSON.stringify(data) });
            const route = payload.data;
            const map = form.closest('[data-titan-maps-navigation]')?.querySelector('[data-titan-map-root]')?.__titanMap;
            map?.setRoute(route.points || [], {
                origin: route.origin,
                destination: route.destination,
                type: route.result_basis === 'straight_line_estimate' ? 'route_estimate' : (route.result_basis === 'last_valid_snapshot' ? 'route_stale' : 'route'),
            });
            const distanceMetres = route.distance_basis === 'road_distance' ? route.road_distance_metres : route.straight_line_distance_metres;
            const km = (Number(distanceMetres || 0) / 1000).toFixed(1);
            const distanceLabel = route.distance_basis === 'road_distance' ? `${km} km road` : `${km} km straight-line estimate`;
            const etaLabel = route.duration_seconds == null ? 'ETA unavailable' : `${Math.max(1, Math.round(Number(route.duration_seconds) / 60))} min ETA`;
            const delay = route.traffic_delay_seconds == null ? '' : ` · traffic delay ${Math.round(Number(route.traffic_delay_seconds) / 60)} min`;
            const provenance = route.result_basis === 'provider_route'
                ? `${route.provider || 'provider'} · fresh`
                : (route.result_basis === 'last_valid_snapshot'
                    ? `${route.provider || 'provider'} · STALE snapshot${route.provider_error_code ? ` · ${route.provider_error_code}` : ''}`
                    : `estimate only${route.provider_error_code ? ` · ${route.provider_error_code}` : ''}`);
            if (status) status.textContent = `${distanceLabel} · ${etaLabel}${delay} · ${provenance}`;
        } catch (error) {
            if (status) status.textContent = error.message;
        }
    });
})();

(() => {
    'use strict';

    document.addEventListener('titan-map:drawing-complete', (event) => {
        const form = document.querySelector('[data-titan-geofence-form]');
        if (!form) return;
        const detail = event.detail || {};
        form.querySelector('[data-geofence-shape-type]').value = detail.shape_type || '';
        form.querySelector('[data-geofence-center-lat]').value = detail.center_latitude ?? '';
        form.querySelector('[data-geofence-center-lng]').value = detail.center_longitude ?? '';
        form.querySelector('[data-geofence-radius]').value = detail.radius_metres ?? '';
        form.querySelector('[data-geofence-geometry]').value = detail.geometry ? JSON.stringify(detail.geometry) : '';
        const save = form.querySelector('[data-geofence-save]');
        if (save) save.disabled = !detail.shape_type;
        const status = form.querySelector('[data-geofence-draw-status]');
        if (status) status.textContent = detail.shape_type === 'circle'
            ? `Circle ready · radius ${Math.round(Number(detail.radius_metres || 0))} m. Add a name and save.`
            : `Polygon ready · ${(detail.geometry || []).length} points. Add a name and save.`;
    });

    document.addEventListener('titan-map:drawing-status', (event) => {
        const status = document.querySelector('[data-geofence-draw-status]');
        if (status) status.textContent = event.detail?.message || 'Draw the geofence on the map.';
    });

    document.addEventListener('titan-map:drawing-cancelled', () => {
        const form = document.querySelector('[data-titan-geofence-form]');
        if (!form) return;
        for (const selector of ['[data-geofence-shape-type]','[data-geofence-center-lat]','[data-geofence-center-lng]','[data-geofence-radius]','[data-geofence-geometry]']) {
            const input = form.querySelector(selector); if (input) input.value = '';
        }
        const save = form.querySelector('[data-geofence-save]'); if (save) save.disabled = true;
        const status = form.querySelector('[data-geofence-draw-status]'); if (status) status.textContent = 'Drawing cancelled. Choose a shape to begin again.';
    });

    document.addEventListener('click', async (event) => {
        const button = event.target.closest('[data-geofence-confirm]');
        if (!button) return;
        button.disabled = true;
        try {
            await window.TitanMapsIntelligence.request(button.dataset.endpoint, {
                method: 'POST', body: JSON.stringify({ approved: button.dataset.approved === '1' }),
            });
            window.location.reload();
        } catch (error) {
            button.disabled = false;
            window.alert(error.message);
        }
    });
})();

(() => {
    'use strict';

    const formatDistance = (resource) => {
        if (resource.distance_metres != null) return `${(Number(resource.distance_metres) / 1000).toFixed(1)} km road`;
        return `${(Number(resource.straight_line_distance_metres || 0) / 1000).toFixed(1)} km straight-line estimate`;
    };
    const formatEta = (seconds) => seconds == null ? 'Unavailable' : `${Math.max(1, Math.round(Number(seconds) / 60))} min`;

    document.addEventListener('submit', async (event) => {
        const form = event.target.closest('[data-titan-nearest-form]');
        if (!form) return;
        event.preventDefault();
        const status = form.querySelector('[data-titan-nearest-status]');
        const data = Object.fromEntries(new FormData(form).entries());
        delete data._token;
        data.origin_latitude = Number(data.origin_latitude);
        data.origin_longitude = Number(data.origin_longitude);
        data.limit = Number(data.limit || 10);
        try {
            if (status) status.textContent = 'Comparing travel times…';
            const payload = await window.TitanMapsIntelligence.request(form.action, { method: 'POST', body: JSON.stringify(data) });
            const result = payload.data || {};
            const resources = Array.isArray(result.resources) ? result.resources.map((row, index) => ({ ...row, rank: index + 1 })) : [];
            const map = form.closest('[data-titan-maps-navigation]')?.querySelector('[data-titan-map-root]')?.__titanMap;
            map?.setComparison(result.origin || { lat: data.origin_latitude, lng: data.origin_longitude }, resources);

            const tbody = document.querySelector('[data-titan-nearest-results]');
            if (tbody) {
                tbody.replaceChildren();
                for (const resource of resources) {
                    const tr = document.createElement('tr');
                    const cells = [
                        `#${resource.rank}`,
                        resource.label || resource.public_reference_id || 'Resource',
                        String(resource.type || '').replaceAll('_', ' '),
                        formatDistance(resource),
                        formatEta(resource.duration_seconds),
                        resource.traffic_delay_seconds == null ? '—' : `${Math.round(Number(resource.traffic_delay_seconds) / 60)} min`,
                        resource.eta_basis === 'stale_snapshot' ? 'Stale snapshot' : (resource.eta_basis === 'provider_eta' ? 'Provider ETA' : 'Estimate only'),
                    ];
                    for (const value of cells) {
                        const td = document.createElement('td'); td.textContent = String(value); tr.appendChild(td);
                    }
                    tbody.appendChild(tr);
                }
            }
            const resultCard = document.querySelector('[data-titan-nearest-result-card]');
            if (resultCard) resultCard.hidden = false;
            if (status) {
                const provenance = result.basis === 'provider_matrix'
                    ? `${result.provider || 'provider'} · ${result.cache_status === 'fresh_cache' ? 'cached fresh matrix' : 'fresh provider matrix'}`
                    : (result.basis === 'stale_matrix_snapshot'
                        ? `${result.provider || 'provider'} · STALE matrix`
                        : 'straight-line estimate only · ETA unavailable');
                status.textContent = `${resources.length} resources ranked · ${provenance}`;
            }
        } catch (error) {
            if (status) status.textContent = error.message;
        }
    });

    document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-titan-use-current-location]');
        if (!button) return;
        const form = button.closest('form');
        if (!form || !navigator.geolocation) return;
        button.disabled = true;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                form.elements.origin_latitude.value = position.coords.latitude.toFixed(7);
                form.elements.origin_longitude.value = position.coords.longitude.toFixed(7);
                button.disabled = false;
            },
            () => { button.disabled = false; },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
        );
    });
})();


(() => {
    'use strict';

    const fmtDistance = metres => metres == null ? '—' : `${(Number(metres) / 1000).toFixed(1)} km`;
    const fmtDuration = seconds => seconds == null ? 'Unavailable' : `${Math.max(1, Math.round(Number(seconds) / 60))} min`;
    let activePlan = null;

    const addStopRow = (tbody, defaults = {}) => {
        const index = tbody.querySelectorAll('[data-route-plan-stop-row]').length;
        const tr = document.createElement('tr');
        tr.dataset.routePlanStopRow = '1';
        const cells = [
            `<td data-stop-number>${index + 1}</td>`,
            `<td><select class="form-select form-select-sm" data-stop-field="stop_type"><option value="depot">Depot</option><option value="job">Job</option><option value="supplier">Supplier</option><option value="contractor">Contractor</option><option value="break">Break</option><option value="custom">Custom</option></select></td>`,
            `<td><input class="form-control form-control-sm" data-stop-field="label" required></td>`,
            `<td><input class="form-control form-control-sm" data-stop-field="latitude" type="number" step="any" required></td>`,
            `<td><input class="form-control form-control-sm" data-stop-field="longitude" type="number" step="any" required></td>`,
            `<td><input class="form-control form-control-sm" data-stop-field="service_minutes" type="number" min="0" max="1440" value="30"></td>`,
            `<td><input class="form-control form-control-sm" data-stop-field="window_start" type="datetime-local"></td>`,
            `<td><input class="form-control form-control-sm" data-stop-field="window_end" type="datetime-local"></td>`,
            `<td class="text-center"><input class="form-check-input" data-stop-field="locked" type="checkbox"></td>`,
            `<td><button class="btn btn-sm btn-outline-secondary" type="button" data-route-plan-remove-stop>Remove</button></td>`,
        ];
        tr.innerHTML = cells.join('');
        tbody.appendChild(tr);
        for (const [field, value] of Object.entries(defaults)) {
            const input = tr.querySelector(`[data-stop-field="${field}"]`);
            if (!input) continue;
            if (input.type === 'checkbox') input.checked = Boolean(value); else input.value = String(value ?? '');
        }
        if (index === 0) {
            const locked = tr.querySelector('[data-stop-field="locked"]');
            locked.checked = true; locked.disabled = true;
            tr.querySelector('[data-route-plan-remove-stop]').disabled = true;
        }
        return tr;
    };

    const stopPayload = tr => {
        const value = name => tr.querySelector(`[data-stop-field="${name}"]`)?.value ?? '';
        const windowStart = value('window_start');
        const windowEnd = value('window_end');
        return {
            stop_type: value('stop_type'), label: value('label'), latitude: Number(value('latitude')), longitude: Number(value('longitude')),
            service_duration_seconds: Math.max(0, Number(value('service_minutes') || 0) * 60),
            ...(windowStart ? { window_start: new Date(windowStart).toISOString() } : {}),
            ...(windowEnd ? { window_end: new Date(windowEnd).toISOString() } : {}),
            locked: Boolean(tr.querySelector('[data-stop-field="locked"]')?.checked),
        };
    };

    const metric = (label, value) => {
        const col = document.createElement('div'); col.className = 'col-6 col-lg-2';
        const card = document.createElement('div'); card.className = 'border rounded p-3 h-100';
        const l = document.createElement('div'); l.className = 'text-muted small'; l.textContent = label;
        const v = document.createElement('div'); v.className = 'fw-bold'; v.textContent = value;
        card.append(l, v); col.append(card); return col;
    };

    const renderPlan = plan => {
        activePlan = plan;
        const root = document.querySelector('[data-titan-maps-navigation="travel.planner"]');
        root?.querySelector('[data-titan-map-root]')?.__titanMap?.setRoutePlan(plan);
        const card = document.querySelector('[data-route-plan-result]'); if (!card) return;
        card.hidden = false;
        const run = plan.run || {};
        const metrics = card.querySelector('[data-route-plan-metrics]'); metrics.replaceChildren();
        metrics.append(
            metric('Revision', `#${run.revision ?? '—'}`), metric('Basis', String(run.basis || '—').replaceAll('_', ' ')),
            metric('Before distance', fmtDistance(run.baseline_distance_metres)), metric('After distance', fmtDistance(run.optimised_distance_metres)),
            metric('Distance saved', fmtDistance(run.distance_savings_metres)), metric('Time saved', fmtDuration(run.duration_savings_seconds)),
        );
        const warning = card.querySelector('[data-route-plan-warning]');
        const warnings = [];
        if (run.basis === 'straight_line_estimate') warnings.push('Routing provider unavailable: sequence is distance-estimate only; ETA savings are unavailable.');
        if (run.basis === 'stale_matrix_snapshot') warnings.push('Route ordering uses a stale provider matrix.');
        if (run.geometry_status === 'sequence_connectors') warnings.push('Map lines are sequence connectors, not road geometry.');
        if (run.geometry_status === 'omitted_segment_limit') warnings.push('Road geometry was skipped because the route exceeds the configured geometry segment limit.');
        if (Array.isArray(run.window_violations) && run.window_violations.length) warnings.push(`${run.window_violations.length} appointment-window conflict(s) require review.`);
        warning.hidden = warnings.length === 0; warning.textContent = warnings.join(' ');

        const tbody = card.querySelector('[data-route-plan-result-stops]'); tbody.replaceChildren();
        for (const [index, stop] of (plan.stops || []).entries()) {
            const tr = document.createElement('tr');
            const vals = [String(index + 1), stop.label || 'Stop', String(stop.stop_type || '').replaceAll('_', ' '), stop.arrival_at ? new Date(stop.arrival_at).toLocaleString() : '—', stop.window_status || '—', stop.status || 'planned'];
            for (const val of vals) { const td = document.createElement('td'); td.textContent = val; tr.appendChild(td); }
            const actions = document.createElement('td');
            if (stop.status === 'planned') {
                for (const [label, status] of [['Complete','completed'],['Cancel','cancelled']]) {
                    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn btn-sm btn-outline-secondary me-2'; btn.textContent = label;
                    btn.dataset.routePlanStopStatus = status; btn.dataset.endpoint = stop.status_url; actions.appendChild(btn);
                }
            }
            tr.appendChild(actions); tbody.appendChild(tr);
        }
    };

    const init = () => {
        const form = document.querySelector('[data-titan-route-plan-form]'); if (!form) return;
        const tbody = form.querySelector('[data-route-plan-stops]');
        if (!tbody.children.length) {
            addStopRow(tbody, { stop_type: 'depot', label: 'Depot / start', service_minutes: 0, locked: true });
            addStopRow(tbody, { stop_type: 'job', label: 'Job 1', service_minutes: 30 });
        }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();

    document.addEventListener('click', async event => {
        const add = event.target.closest('[data-route-plan-add-stop]');
        if (add) {
            const form = add.closest('form'), tbody = form.querySelector('[data-route-plan-stops]');
            if (tbody.children.length < Number(form.dataset.maxStops || 20)) addStopRow(tbody, { stop_type: 'job', label: `Job ${tbody.children.length}` });
            return;
        }
        const remove = event.target.closest('[data-route-plan-remove-stop]');
        if (remove) { remove.closest('[data-route-plan-stop-row]')?.remove(); return; }
        const reroute = event.target.closest('[data-route-plan-reoptimise]');
        if (reroute && activePlan?.actions?.optimise) {
            reroute.disabled = true;
            try { renderPlan((await window.TitanMapsIntelligence.request(activePlan.actions.optimise, { method:'POST', body:JSON.stringify({ render_geometry:false }) })).data); }
            finally { reroute.disabled = false; }
            return;
        }
        const statusButton = event.target.closest('[data-route-plan-stop-status]');
        if (statusButton) {
            statusButton.disabled = true;
            try { renderPlan((await window.TitanMapsIntelligence.request(statusButton.dataset.endpoint, { method:'POST', body:JSON.stringify({ status:statusButton.dataset.routePlanStopStatus, render_geometry:false }) })).data); }
            finally { statusButton.disabled = false; }
        }
    });

    document.addEventListener('submit', async event => {
        const form = event.target.closest('[data-titan-route-plan-form]');
        if (form) {
            event.preventDefault();
            const status = form.querySelector('[data-route-plan-status]');
            const base = Object.fromEntries(new FormData(form).entries()); delete base._token;
            const payload = {
                name: base.name, service_date: base.service_date || null, worker_public_id: base.worker_public_id || null,
                travel_mode: base.travel_mode, routing_preference: base.routing_preference,
                start_at: base.start_at ? new Date(base.start_at).toISOString() : null,
                render_geometry: Boolean(form.elements.render_geometry?.checked),
                stops: [...form.querySelectorAll('[data-route-plan-stop-row]')].map(stopPayload),
            };
            try { if (status) status.textContent = 'Building matrix and optimising route…'; renderPlan((await window.TitanMapsIntelligence.request(form.action,{method:'POST',body:JSON.stringify(payload)})).data); if(status) status.textContent='Route plan created.'; }
            catch(error){ if(status) status.textContent=error.message; }
            return;
        }
        const emergency = event.target.closest('[data-route-plan-emergency-form]');
        if (emergency && activePlan?.actions?.emergency) {
            event.preventDefault(); const data=Object.fromEntries(new FormData(emergency).entries());
            const payload={ label:data.label, stop_type:'job', latitude:Number(data.latitude), longitude:Number(data.longitude), service_duration_seconds:Number(data.service_minutes||0)*60, render_geometry:false };
            try { renderPlan((await window.TitanMapsIntelligence.request(activePlan.actions.emergency,{method:'POST',body:JSON.stringify(payload)})).data); emergency.reset(); }
            catch(error){ window.alert(error.message); }
        }
    });
})();

(() => {
    'use strict';
    let activeRecommendation = null;
    const fmtMinutes = seconds => seconds == null ? 'Unavailable' : `${Math.max(1, Math.round(Number(seconds) / 60))} min`;
    const fmtPoints = value => `${Number(value || 0).toFixed(1)}`;

    const td = value => { const cell=document.createElement('td'); cell.textContent=value == null ? '—' : String(value); return cell; };

    function renderDispatch(rec) {
        activeRecommendation = rec;
        const root=document.querySelector('[data-titan-maps-navigation="field.dispatch"]');
        root?.querySelector('[data-titan-map-root]')?.__titanMap?.setDispatchRecommendation(rec);
        const card=document.querySelector('[data-titan-dispatch-result]'); if(!card) return;
        card.hidden=false;
        const state=card.querySelector('[data-titan-dispatch-state]'); if(state) state.textContent=String(rec.status||'');
        const summary=card.querySelector('[data-titan-dispatch-summary]');
        if(summary) summary.textContent=`${rec.job_title || rec.job_public_id} · priority ${rec.priority || 'normal'} · ${rec.summary?.eligible_count ?? 0} eligible of ${rec.summary?.candidate_count ?? 0} scored · ${String(rec.summary?.matrix_basis || 'unknown').replaceAll('_',' ')}`;
        const tbody=card.querySelector('[data-titan-dispatch-candidates]'); tbody.replaceChildren();
        for(const candidate of rec.candidates || []) {
            const tr=document.createElement('tr');
            if(candidate.blocked) tr.classList.add('opacity-75');
            tr.append(td(candidate.rank),td(candidate.worker_public_id),td(fmtPoints(candidate.score)),td(fmtMinutes(candidate.duration_seconds)),td(fmtPoints(candidate.dimensions?.travel)),td(fmtPoints(candidate.dimensions?.skill)),td(fmtPoints(candidate.dimensions?.availability)));
            const evidence=document.createElement('td');
            const messages=[];
            if(candidate.blockers?.length) messages.push(`Blocked: ${candidate.blockers.join(', ')}`);
            if(candidate.evidence?.certification?.status) messages.push(`Certification: ${candidate.evidence.certification.status}`);
            if(candidate.evidence?.skill?.status) messages.push(`Skill evidence: ${candidate.evidence.skill.status}`);
            if(candidate.explanations?.length) messages.push(candidate.explanations.join(' '));
            evidence.textContent=messages.join(' · ') || 'No additional evidence'; tr.appendChild(evidence);
            const actions=document.createElement('td');
            if(!candidate.blocked && rec.status === 'pending_approval') {
                for(const [label,assign,klass] of [['Approve',false,'btn-outline-primary'],['Approve and assign',true,'btn-primary']]) {
                    const btn=document.createElement('button'); btn.type='button'; btn.className=`btn btn-sm ${klass} me-2 mb-1`; btn.textContent=label;
                    btn.dataset.dispatchDecision='approve'; btn.dataset.candidateId=candidate.id; btn.dataset.assign=assign?'1':'0'; btn.dataset.endpoint=rec.actions?.decide||''; actions.appendChild(btn);
                }
                const reject=document.createElement('button'); reject.type='button'; reject.className='btn btn-sm btn-outline-secondary mb-1'; reject.textContent='Reject recommendation'; reject.dataset.dispatchDecision='reject'; reject.dataset.candidateId=candidate.id; reject.dataset.assign='0'; reject.dataset.endpoint=rec.actions?.decide||''; actions.appendChild(reject);
            } else actions.textContent=candidate.blocked?'Blocked':(rec.status||'Decided');
            tr.appendChild(actions); tbody.appendChild(tr);
        }
    }

    document.addEventListener('submit', async event => {
        const form=event.target.closest('[data-titan-dispatch-form]'); if(!form) return;
        event.preventDefault(); const status=form.querySelector('[data-titan-dispatch-status]');
        const data=Object.fromEntries(new FormData(form).entries()); delete data._token; data.limit=Number(data.limit||10);
        try { if(status) status.textContent='Scoring eligible workers and travel evidence…'; const payload=await window.TitanMapsIntelligence.request(form.action,{method:'POST',body:JSON.stringify(data)}); renderDispatch(payload.data); if(status) status.textContent='Recommendation ready for human review.'; }
        catch(error){ if(status) status.textContent=error.message; }
    });

    document.addEventListener('click', async event => {
        const button=event.target.closest('[data-dispatch-decision]'); if(!button) return;
        const decision=button.dataset.dispatchDecision; const assign=button.dataset.assign==='1';
        const promptText=assign?'Approve this worker and request assignment in the authoritative CRM?':(decision==='approve'?'Approve this recommendation without assigning the worker?':'Reject this candidate recommendation?');
        if(!window.confirm(promptText)) return;
        button.disabled=true;
        try {
            const payload=await window.TitanMapsIntelligence.request(button.dataset.endpoint,{method:'POST',body:JSON.stringify({decision,candidate_id:button.dataset.candidateId,assign})});
            renderDispatch(payload.data.recommendation);
            const status=document.querySelector('[data-titan-dispatch-status]');
            if(status) status.textContent=assign?`Decision saved · assignment ${payload.data.decision.assignment_status}`:'Human decision saved.';
        } catch(error){ window.alert(error.message); } finally { button.disabled=false; }
    });
})();

(() => {
    'use strict';

    const form = () => document.querySelector('[data-titan-service-territory-form]');

    document.addEventListener('titan-map:drawing-complete', (event) => {
        const territoryForm = form();
        if (!territoryForm) return;
        const detail = event.detail || {};
        const mode = territoryForm.querySelector('[data-territory-match-mode]');
        if (mode && ['circle','polygon'].includes(detail.shape_type)) mode.value = detail.shape_type;
        const assignments = [
            ['[data-territory-center-lat]', detail.center_latitude ?? ''],
            ['[data-territory-center-lng]', detail.center_longitude ?? ''],
            ['[data-territory-radius]', detail.radius_metres ?? ''],
            ['[data-territory-geometry]', detail.geometry ? JSON.stringify(detail.geometry) : ''],
        ];
        for (const [selector, value] of assignments) {
            const el = territoryForm.querySelector(selector); if (el) el.value = value;
        }
        const status = territoryForm.querySelector('[data-territory-draw-status]');
        if (status) status.textContent = detail.shape_type === 'circle'
            ? `Service-area circle ready · radius ${Math.round(Number(detail.radius_metres || 0))} m.`
            : `Service-area polygon ready · ${(detail.geometry || []).length} vertices.`;
        updateLocalityVisibility();
    });

    function updateLocalityVisibility() {
        const territoryForm = form(); if (!territoryForm) return;
        const mode = territoryForm.querySelector('[data-territory-match-mode]')?.value || 'circle';
        const wrap = territoryForm.querySelector('[data-territory-locality-wrap]');
        if (wrap) wrap.hidden = !['postcode','suburb'].includes(mode);
        const status = territoryForm.querySelector('[data-territory-draw-status]');
        if (status && ['postcode','suburb'].includes(mode)) status.textContent = 'Enter exact locality values; no synthetic boundary polygon will be drawn.';
    }

    document.addEventListener('change', event => {
        if (event.target.matches('[data-territory-match-mode]')) updateLocalityVisibility();
        const mode = event.target.closest('[data-travel-zone-mode]');
        if (mode) {
            const root = mode.closest('form');
            const minutes = root?.querySelector('[data-travel-zone-minutes]')?.closest('.col-md-3');
            const km = root?.querySelector('[data-travel-zone-km]')?.closest('.col-md-3');
            if (minutes) minutes.hidden = mode.value !== 'drive_time';
            if (km) km.hidden = mode.value !== 'road_distance';
        }
    });

    document.addEventListener('click', event => {
        const button = event.target.closest('[data-territory-use-current-location]');
        if (!button) return;
        const territoryForm = button.closest('form');
        if (!navigator.geolocation) { window.alert('Geolocation is not available in this browser.'); return; }
        button.disabled = true;
        navigator.geolocation.getCurrentPosition(position => {
            const lat = territoryForm?.elements?.latitude, lng = territoryForm?.elements?.longitude;
            if (lat) lat.value = String(position.coords.latitude);
            if (lng) lng.value = String(position.coords.longitude);
            button.disabled = false;
        }, error => { button.disabled = false; window.alert(error.message || 'Unable to read current location.'); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
    });

    const init = () => {
        updateLocalityVisibility();
        const mode = document.querySelector('[data-travel-zone-mode]');
        if (mode) mode.dispatchEvent(new Event('change', { bubbles: true }));
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();

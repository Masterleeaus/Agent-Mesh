<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Models\MapGeofence;
use App\Extensions\TitanMapsIntelligence\Models\MapGeofenceEvent;
use App\Extensions\TitanMapsIntelligence\Services\GeofenceManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class GeofenceController
{
    public function __construct(private readonly GeofenceManagementService $geofences, private readonly AuthorisedCompanyContext $context) {}

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $data = $request->validate([
            'name'=>['required','string','max:191'],'description'=>['nullable','string','max:2000'],
            'shape_type'=>['required','in:circle,polygon'],'center_latitude'=>['nullable','numeric','between:-90,90'],
            'center_longitude'=>['nullable','numeric','between:-180,180'],'radius_metres'=>['nullable','numeric','min:1'],
            'geometry'=>['nullable'],'reference_type'=>['nullable','in:job,property,branch,worker,supplier,contractor'],
            'public_reference_id'=>['nullable','string','max:191'],'dwell_seconds'=>['nullable','integer','between:0,86400'],
            'hysteresis_metres'=>['nullable','numeric','between:0,500'],'transition_samples'=>['nullable','integer','between:1,10'],
            'arrival_confirmation_required'=>['nullable','boolean'],'departure_confirmation_required'=>['nullable','boolean'],
        ]);
        $geofence = $this->geofences->create($data);
        if ($request->expectsJson()) return response()->json(['data'=>$this->geofencePayload($geofence)], 201);
        return redirect()->route('dashboard.user.titan-maps-intelligence.field.geofences')->with('status', 'Geofence created.');
    }

    public function index(): JsonResponse
    {
        return response()->json(['data'=>MapGeofence::query()->forCompany($this->context->companyId())->latest()->limit(250)->get()->map(fn (MapGeofence $g)=>$this->geofencePayload($g))->values()]);
    }

    public function events(): JsonResponse
    {
        return response()->json(['data'=>MapGeofenceEvent::query()->forCompany($this->context->companyId())->latest('occurred_at')->limit(200)->get()->values()]);
    }

    public function confirm(Request $request, string $eventId): JsonResponse
    {
        $data = $request->validate(['approved'=>['required','boolean']]);
        $event = $this->geofences->confirmEvent($eventId, (bool) $data['approved']);
        return response()->json(['data'=>$event]);
    }

    private function geofencePayload(MapGeofence $g): array
    {
        return [
            'id'=>$g->id,'name'=>$g->name,'shape_type'=>$g->shape_type,'center_latitude'=>$g->center_latitude,
            'center_longitude'=>$g->center_longitude,'radius_metres'=>$g->radius_metres,'geometry'=>$g->geometry,
            'reference_type'=>$g->reference_type,'public_reference_id'=>$g->public_reference_id,'enabled'=>(bool)$g->enabled,
            'dwell_seconds'=>(int)$g->dwell_seconds,'hysteresis_metres'=>$g->hysteresis_metres,'transition_samples'=>$g->transition_samples,
        ];
    }
}

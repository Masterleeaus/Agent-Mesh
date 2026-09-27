<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuditRecorder;
use App\Extensions\TitanMapsIntelligence\Events\GeofenceTransitionDetected;
use App\Extensions\TitanMapsIntelligence\Models\MapGeofence;
use App\Extensions\TitanMapsIntelligence\Models\MapGeofenceEvent;
use App\Extensions\TitanMapsIntelligence\Models\MapGeofenceWorkerState;
use App\Extensions\TitanMapsIntelligence\Models\MapLocationPing;
use App\Extensions\TitanMapsIntelligence\Support\GeofenceTransitionFilter;
use App\Extensions\TitanMapsIntelligence\Events\WorkerEnteredJobGeofence;
use App\Extensions\TitanMapsIntelligence\Events\WorkerExitedJobGeofence;
use App\Extensions\TitanMapsIntelligence\Events\GeofenceDwellThresholdReached;
use App\Extensions\TitanMapsIntelligence\Events\WorkerArrivedAtJob;
use App\Extensions\TitanMapsIntelligence\Events\WorkerDepartedJob;
use Illuminate\Support\Facades\Event;

final class GeofenceEvaluationService
{
    public function __construct(
        private readonly GeofenceGeometryService $geometry,
        private readonly MapsConfiguration $configuration,
        private readonly AuditRecorder $audit,
        private readonly GeofenceTransitionFilter $transitions,
        private readonly GeofenceConfidenceService $confidence,
    ) {}

    /** @return array<int,MapGeofenceEvent> */
    public function evaluate(MapLocationPing $ping): array
    {
        if (! $this->configuration->geofencingEnabled()) return [];
        $query = MapGeofence::query()->forCompany((string) $ping->company_id)->where('enabled', true);
        $query->where(static function ($q) use ($ping): void {
            $q->whereNull('branch_id');
            if ($ping->branch_id !== null) $q->orWhere('branch_id', $ping->branch_id);
        });
        $events = [];
        foreach ($query->get() as $geofence) {
            $event = $this->evaluateOne($geofence, $ping);
            if ($event !== null) $events[] = $event;
            $dwell = $this->maybeDwell($geofence, $ping);
            if ($dwell !== null) $events[] = $dwell;
        }
        return $events;
    }

    private function evaluateOne(MapGeofence $geofence, MapLocationPing $ping): ?MapGeofenceEvent
    {
        $state = MapGeofenceWorkerState::query()->firstOrCreate(
            ['company_id' => $ping->company_id, 'geofence_id' => $geofence->id, 'worker_public_id' => $ping->worker_public_id],
            ['branch_id' => $ping->branch_id, 'workspace_id' => $ping->workspace_id, 'is_inside' => false, 'candidate_samples' => 0],
        );
        $rawInside = $this->geometry->contains(
            $geofence, (float) $ping->latitude, (float) $ping->longitude, (float) $ping->accuracy_metres,
            (bool) $state->is_inside, $this->confidence->effectiveHysteresis((float)($geofence->hysteresis_metres ?? $this->configuration->geofenceHysteresisMetres()), (float)$ping->accuracy_metres),
        );
        $captured = $ping->captured_at;
        $requiredSamples=(int)($geofence->transition_samples ?? $this->configuration->geofenceTransitionSamples());
        $decision = $this->transitions->next((bool) $state->is_inside, $state->candidate_state, (int) $state->candidate_samples, $rawInside, $requiredSamples);
        $state->forceFill([
            'candidate_state' => $decision['candidate_state'],
            'candidate_samples' => $decision['candidate_samples'],
            'candidate_started_at' => $decision['candidate_state'] === null ? null : ($state->candidate_state === $decision['candidate_state'] ? $state->candidate_started_at : $captured),
            'last_evaluated_at' => $captured,
            'last_location_ping_id' => $ping->id,
        ])->save();
        if ($decision['transition'] === null) return null;

        $entering = $decision['transition'] === 'inside';
        $state->forceFill([
            'is_inside' => $entering,
            'candidate_state' => null,
            'candidate_samples' => 0,
            'candidate_started_at' => null,
            'entered_at' => $entering ? $captured : null,
            'last_dwell_event_at' => $entering ? null : $state->last_dwell_event_at,
        ])->save();
        return $this->recordTransition($geofence, $ping, $entering ? 'entry' : 'exit');
    }

    private function maybeDwell(MapGeofence $geofence, MapLocationPing $ping): ?MapGeofenceEvent
    {
        $state = MapGeofenceWorkerState::query()->forCompany((string) $ping->company_id)
            ->where('geofence_id', $geofence->id)->where('worker_public_id', $ping->worker_public_id)->first();
        if ($state === null || ! $state->is_inside || $state->entered_at === null || (int) $geofence->dwell_seconds <= 0 || $state->last_dwell_event_at !== null) return null;
        if ($ping->captured_at->getTimestamp() - $state->entered_at->getTimestamp() < (int) $geofence->dwell_seconds) return null;
        $event = $this->createEvent($geofence, $ping, 'dwell', false);
        $state->forceFill(['last_dwell_event_at' => $ping->captured_at])->save();
        Event::dispatch(new GeofenceDwellThresholdReached($event));
        return $event;
    }

    private function recordTransition(MapGeofence $geofence, MapLocationPing $ping, string $transition): MapGeofenceEvent
    {
        $isOperationalReference = in_array((string) $geofence->reference_type, ['job','property'], true);
        $eventType = $isOperationalReference ? ($transition === 'entry' ? 'arrival' : 'departure') : $transition;
        $requires = $isOperationalReference && ($transition === 'entry'
            ? (bool) $geofence->arrival_confirmation_required
            : (bool) $geofence->departure_confirmation_required);
        $event = $this->createEvent($geofence, $ping, $eventType, $requires);
        if ($geofence->reference_type === 'job') {
            Event::dispatch($transition === 'entry' ? new WorkerEnteredJobGeofence($event) : new WorkerExitedJobGeofence($event));
            if (! $requires) Event::dispatch($transition === 'entry' ? new WorkerArrivedAtJob($event) : new WorkerDepartedJob($event));
        }
        return $event;
    }

    private function createEvent(MapGeofence $geofence, MapLocationPing $ping, string $eventType, bool $requiresConfirmation): MapGeofenceEvent
    {
        $idempotency = hash('sha256', implode('|', [$ping->company_id,$geofence->id,$ping->worker_public_id,$eventType,$ping->id]));
        $scale=(string)$geofence->shape_type==='circle'?max(10.0,(float)$geofence->radius_metres):50.0;
        $required=(int)($geofence->transition_samples ?? $this->configuration->geofenceTransitionSamples());
        $confidence=$this->confidence->confidence((float)$ping->accuracy_metres,$scale,$required,$required);
        $event = MapGeofenceEvent::query()->firstOrCreate(
            ['company_id' => $ping->company_id, 'idempotency_key' => $idempotency],
            [
                'branch_id' => $ping->branch_id, 'workspace_id' => $ping->workspace_id, 'geofence_id' => $geofence->id,
                'worker_public_id' => $ping->worker_public_id, 'location_ping_id' => $ping->id, 'event_type' => $eventType,
                'reference_type' => $geofence->reference_type, 'public_reference_id' => $geofence->public_reference_id,
                'requires_confirmation' => $requiresConfirmation, 'confirmation_status' => $requiresConfirmation ? 'pending' : 'none',
                'occurred_at' => $ping->captured_at,
                'confidence_percent' => $confidence,
                'metadata' => ['accuracy_metres'=>(float) $ping->accuracy_metres,'shape_type'=>$geofence->shape_type,'hysteresis_metres'=>(float)($geofence->hysteresis_metres ?? $this->configuration->geofenceHysteresisMetres()),'transition_samples'=>$required],
            ],
        );
        $this->audit->record([
            'event' => 'maps.geofence.transition', 'company_id' => $ping->company_id, 'geofence_id' => $geofence->id,
            'geofence_event_id' => $event->id, 'worker_public_id' => $ping->worker_public_id, 'event_type' => $eventType,
            'requires_confirmation' => $requiresConfirmation,
        ]);
        Event::dispatch(new GeofenceTransitionDetected($event));
        return $event;
    }
}

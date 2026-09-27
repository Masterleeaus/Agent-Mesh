<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\AuditRecorder;
use App\Extensions\TitanMapsIntelligence\Contracts\FieldReferenceGateway;
use App\Extensions\TitanMapsIntelligence\Events\GeofenceActionConfirmed;
use App\Extensions\TitanMapsIntelligence\Events\WorkerArrivedAtJob;
use App\Extensions\TitanMapsIntelligence\Events\WorkerDepartedJob;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Models\MapGeofence;
use App\Extensions\TitanMapsIntelligence\Models\MapGeofenceEvent;
use App\Extensions\TitanMapsIntelligence\Models\MapLocation;
use App\Extensions\TitanMapsIntelligence\Exceptions\MissingHostContractException;
use DateTimeImmutable;
use Illuminate\Support\Facades\Event;

final class GeofenceManagementService
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly FieldReferenceGateway $references,
        private readonly GeofenceGeometryService $geometry,
        private readonly MapsConfiguration $configuration,
        private readonly AuditRecorder $audit,
    ) {}

    /** @param array<string,mixed> $input */
    public function create(array $input): MapGeofence
    {
        if (! $this->configuration->geofencingEnabled()) {
            throw MapsIntelligenceException::fromCode('MAPS_GEOFENCING_DISABLED', 'Geofencing is disabled for Titan Maps Intelligence.');
        }
        $companyId = $this->context->companyId();
        $userId = $this->context->userId();
        $shape = strtolower(trim((string) ($input['shape_type'] ?? '')));
        if (! in_array($shape, ['circle','polygon'], true)) {
            throw MapsIntelligenceException::fromCode('MAPS_GEOFENCE_INVALID', 'Geofence shape_type must be circle or polygon.');
        }

        $referenceType = trim((string) ($input['reference_type'] ?? '')) ?: null;
        $referenceId = trim((string) ($input['public_reference_id'] ?? '')) ?: null;
        $branchId = $input['branch_id'] ?? null;
        $workspaceId = $input['workspace_id'] ?? null;
        if (($referenceType === null) !== ($referenceId === null)) {
            throw MapsIntelligenceException::fromCode('MAPS_GEOFENCE_REFERENCE_INVALID', 'Reference type and public reference ID must be supplied together.');
        }
        if ($referenceType !== null) {
            $reference = null;
            try {
                $reference = $this->references->resolve($companyId, $referenceType, $referenceId);
            } catch (MissingHostContractException) {
                // Host adapter is optional. A canonical company-scoped Maps projection is an acceptable local proof.
            }
            if ($reference !== null) {
                $branchId ??= $reference->branchId;
                $workspaceId ??= $reference->workspaceId;
            } else {
                $location = MapLocation::query()->forCompany($companyId)
                    ->where('reference_type', $referenceType)->where('public_reference_id', $referenceId)->first();
                if ($location === null) {
                    throw MapsIntelligenceException::fromCode('MAPS_GEOFENCE_REFERENCE_NOT_FOUND', 'The attached Titan reference is unavailable in this company.');
                }
                $branchId ??= $location->branch_id;
                $workspaceId ??= $location->workspace_id;
            }
        }

        $centerLat = $centerLng = $radius = null;
        $polygon = null;
        if ($shape === 'circle') {
            $centerLat = $this->coordinate($input['center_latitude'] ?? null, -90, 90, 'center_latitude');
            $centerLng = $this->coordinate($input['center_longitude'] ?? null, -180, 180, 'center_longitude');
            $radius = (float) ($input['radius_metres'] ?? 0);
            if ($radius < $this->configuration->minimumGeofenceRadiusMetres() || $radius > $this->configuration->maximumGeofenceRadiusMetres()) {
                throw MapsIntelligenceException::fromCode('MAPS_GEOFENCE_INVALID', 'Circle radius is outside the configured geofence limits.');
            }
        } else {
            $raw = $input['geometry'] ?? [];
            if (is_string($raw)) $raw = json_decode($raw, true);
            if (! is_array($raw)) throw MapsIntelligenceException::fromCode('MAPS_GEOFENCE_INVALID', 'Polygon geometry must be an array.');
            try { $polygon = $this->geometry->validatePolygon($raw); }
            catch (\InvalidArgumentException $e) { throw MapsIntelligenceException::fromCode('MAPS_GEOFENCE_INVALID', $e->getMessage()); }
            if (count($polygon) > $this->configuration->maximumGeofencePolygonPoints()) {
                throw MapsIntelligenceException::fromCode('MAPS_GEOFENCE_INVALID', 'Polygon has too many points.');
            }
        }

        $dwellSeconds = (int) ($input['dwell_seconds'] ?? $this->configuration->defaultGeofenceDwellSeconds());
        if ($dwellSeconds < 0 || $dwellSeconds > 86400) {
            throw MapsIntelligenceException::fromCode('MAPS_GEOFENCE_INVALID', 'Dwell threshold must be between 0 and 86400 seconds.');
        }
        $hysteresisMetres = isset($input['hysteresis_metres']) ? (float)$input['hysteresis_metres'] : $this->configuration->geofenceHysteresisMetres();
        $transitionSamples = isset($input['transition_samples']) ? (int)$input['transition_samples'] : $this->configuration->geofenceTransitionSamples();
        if ($hysteresisMetres < 0 || $hysteresisMetres > 500) throw MapsIntelligenceException::fromCode('MAPS_GEOFENCE_INVALID','Geofence hysteresis must be between 0 and 500 metres.');
        if ($transitionSamples < 1 || $transitionSamples > 10) throw MapsIntelligenceException::fromCode('MAPS_GEOFENCE_INVALID','Geofence transition_samples must be between 1 and 10.');

        $geofence = MapGeofence::query()->create([
            'company_id' => $companyId,
            'branch_id' => $branchId,
            'workspace_id' => $workspaceId,
            'name' => trim((string) ($input['name'] ?? '')) ?: 'Untitled geofence',
            'description' => trim((string) ($input['description'] ?? '')) ?: null,
            'shape_type' => $shape,
            'center_latitude' => $centerLat,
            'center_longitude' => $centerLng,
            'radius_metres' => $radius,
            'geometry' => $polygon,
            'reference_type' => $referenceType,
            'public_reference_id' => $referenceId,
            'enabled' => (bool) ($input['enabled'] ?? true),
            'arrival_confirmation_required' => (bool) ($input['arrival_confirmation_required'] ?? true),
            'departure_confirmation_required' => (bool) ($input['departure_confirmation_required'] ?? true),
            'dwell_seconds' => $dwellSeconds,
            'hysteresis_metres' => $hysteresisMetres,
            'transition_samples' => $transitionSamples,
            'created_by_user_id' => $userId,
            'updated_by_user_id' => $userId,
        ]);

        $this->audit->record([
            'event' => 'maps.geofence.created', 'company_id' => $companyId, 'geofence_id' => $geofence->id,
            'shape_type' => $shape, 'reference_type' => $referenceType, 'public_reference_id' => $referenceId,
        ]);
        return $geofence;
    }

    public function confirmEvent(string $eventId, bool $approve): MapGeofenceEvent
    {
        $event = MapGeofenceEvent::query()->forCompany($this->context->companyId())->whereKey($eventId)->firstOrFail();
        if (! $event->requires_confirmation || $event->confirmation_status !== 'pending') {
            throw MapsIntelligenceException::fromCode('MAPS_GEOFENCE_CONFIRMATION_INVALID', 'This geofence event is not awaiting confirmation.');
        }
        $event->forceFill([
            'confirmation_status' => $approve ? 'confirmed' : 'rejected',
            'confirmed_by_user_id' => $this->context->userId(),
            'confirmed_at' => new DateTimeImmutable('now'),
        ])->save();
        if ($approve) {
            $confirmed = $event->refresh();
            Event::dispatch(new GeofenceActionConfirmed($confirmed));
            if ($confirmed->reference_type === 'job' && $confirmed->event_type === 'arrival') Event::dispatch(new WorkerArrivedAtJob($confirmed));
            if ($confirmed->reference_type === 'job' && $confirmed->event_type === 'departure') Event::dispatch(new WorkerDepartedJob($confirmed));
        }
        $this->audit->record([
            'event' => $approve ? 'maps.geofence.action_confirmed' : 'maps.geofence.action_rejected',
            'company_id' => $event->company_id, 'geofence_event_id' => $event->id, 'geofence_id' => $event->geofence_id,
        ]);
        return $event->refresh();
    }

    private function coordinate(mixed $value, float $min, float $max, string $field): float
    {
        if (! is_numeric($value) || (float) $value < $min || (float) $value > $max) {
            throw MapsIntelligenceException::fromCode('MAPS_GEOFENCE_INVALID', "{$field} is outside valid coordinate bounds.");
        }
        return (float) $value;
    }
}

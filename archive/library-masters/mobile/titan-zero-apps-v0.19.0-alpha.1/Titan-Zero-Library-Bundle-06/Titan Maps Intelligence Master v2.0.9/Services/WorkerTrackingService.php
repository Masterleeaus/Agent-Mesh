<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuditRecorder;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\WorkerIdentityResolver;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialSignalPublisher;
use App\Extensions\TitanMapsIntelligence\DTO\WorkerLocationIngestionResult;
use App\Extensions\TitanMapsIntelligence\DTO\WorkerLocationPing;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Models\MapLocation;
use App\Extensions\TitanMapsIntelligence\Models\MapLocationPing;
use App\Extensions\TitanMapsIntelligence\Models\MapWorkerTrackingState;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;

final class WorkerTrackingService
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly WorkerIdentityResolver $identities,
        private readonly MapsConfiguration $configuration,
        private readonly AuditRecorder $audit,
        private readonly GeofenceEvaluationService $geofences,
        private readonly SpatialSignalPublisher $signals,
        private readonly SpatialExecutionContextStore $executionContexts,
        private readonly SpatialExecutionContextFactory $contextFactory,
    ) {}

    public function setStatus(bool $trackingAllowed, bool $onDuty, ?string $requestedWorkerPublicId = null, ?DateTimeImmutable $shareHistoryUntil = null): MapWorkerTrackingState
    {
        if (! $this->configuration->workerTrackingEnabled()) {
            throw MapsIntelligenceException::fromCode('MAPS_TRACKING_DISABLED', 'Worker location tracking is disabled for Titan Maps Intelligence.');
        }

        $identity = $this->identities->resolve($this->context->companyId(), $this->context->userId(), $requestedWorkerPublicId);
        $now = new DateTimeImmutable('now');

        $state = MapWorkerTrackingState::query()->updateOrCreate(
            ['company_id' => $identity->companyId, 'worker_public_id' => $identity->workerPublicId],
            [
                'branch_id' => $identity->branchId,
                'workspace_id' => $identity->workspaceId,
                'user_id' => $identity->userId,
                'tracking_allowed' => $trackingAllowed,
                'on_duty' => $onDuty,
                'status_changed_at' => $now,
                'share_history_until' => $shareHistoryUntil,
            ],
        );

        $this->audit->record([
            'event' => 'maps.worker_tracking.status_changed',
            'company_id' => $identity->companyId,
            'worker_public_id' => $identity->workerPublicId,
            'user_id' => $identity->userId,
            'tracking_allowed' => $trackingAllowed,
            'on_duty' => $onDuty,
            'occurred_at' => $now->format(DATE_ATOM),
        ]);

        return $state->refresh();
    }

    public function current(?string $requestedWorkerPublicId = null): array
    {
        $identity = $this->identities->resolve($this->context->companyId(), $this->context->userId(), $requestedWorkerPublicId);
        $state = MapWorkerTrackingState::query()
            ->forCompany($identity->companyId)
            ->where('worker_public_id', $identity->workerPublicId)
            ->first();
        $location = MapLocation::query()
            ->forCompany($identity->companyId)
            ->where('reference_type', 'worker')
            ->where('public_reference_id', $identity->workerPublicId)
            ->first();

        return ['identity' => $identity, 'state' => $state, 'location' => $location];
    }

    public function ingest(WorkerLocationPing $payload, ?string $requestedWorkerPublicId = null, ?string $deviceId = null): WorkerLocationIngestionResult
    {
        if (! $this->configuration->workerTrackingEnabled()) {
            throw MapsIntelligenceException::fromCode('MAPS_TRACKING_DISABLED', 'Worker location tracking is disabled for Titan Maps Intelligence.');
        }

        $identity = $this->identities->resolve($this->context->companyId(), $this->context->userId(), $requestedWorkerPublicId);
        $state = MapWorkerTrackingState::query()
            ->forCompany($identity->companyId)
            ->where('worker_public_id', $identity->workerPublicId)
            ->first();

        if ($state === null || ! (bool) $state->tracking_allowed) {
            throw MapsIntelligenceException::fromCode('MAPS_TRACKING_NOT_ALLOWED', 'Worker location tracking consent/permission is not enabled.');
        }
        if (! (bool) $state->on_duty) {
            throw MapsIntelligenceException::fromCode('MAPS_WORKER_OFF_DUTY', 'Off-duty workers cannot publish live location.');
        }

        $now = new DateTimeImmutable('now');
        $age = $now->getTimestamp() - $payload->capturedAt->getTimestamp();
        if ($age > $this->configuration->maximumCaptureAgeSeconds()) {
            $this->publishAnomaly('MAPS_LOCATION_CAPTURE_STALE',$identity->workerPublicId,['age_seconds'=>$age]);
            throw MapsIntelligenceException::fromCode('MAPS_LOCATION_CAPTURE_STALE', 'The location sample is older than the accepted capture window.');
        }
        if ($age < -$this->configuration->maximumFutureSkewSeconds()) {
            $this->publishAnomaly('MAPS_LOCATION_CAPTURE_FUTURE',$identity->workerPublicId,['age_seconds'=>$age]);
            throw MapsIntelligenceException::fromCode('MAPS_LOCATION_CAPTURE_FUTURE', 'The location sample timestamp is too far in the future.');
        }
        if ($payload->accuracyMetres > $this->configuration->maximumLocationAccuracyMetres()) {
            $this->publishAnomaly('MAPS_LOCATION_ACCURACY_TOO_LOW',$identity->workerPublicId,['accuracy_metres'=>$payload->accuracyMetres]);
            throw MapsIntelligenceException::fromCode('MAPS_LOCATION_ACCURACY_TOO_LOW', 'The location sample is not accurate enough for field tracking.');
        }
        if ($state->latest_captured_at !== null && $payload->capturedAt <= $state->latest_captured_at) {
            $this->publishAnomaly('MAPS_LOCATION_CAPTURE_STALE',$identity->workerPublicId,['reason'=>'non_monotonic_capture']);
            throw MapsIntelligenceException::fromCode('MAPS_LOCATION_CAPTURE_STALE', 'The location sample is not newer than the worker\'s latest accepted sample.');
        }

        $offlineSync = (bool) ($payload->motionMetadata['offline_sync'] ?? false);
        $clientSampleId = trim((string) ($payload->motionMetadata['client_sample_id'] ?? ''));
        $offlineClassification = $offlineSync ? (string) ($payload->motionMetadata['offline_classification'] ?? 'live') : null;
        $geofenceEligible = $offlineSync ? (bool) ($payload->motionMetadata['geofence_eligible'] ?? true) : true;
        $retentionExpiresAt = isset($payload->motionMetadata['retention_expires_at']) ? new DateTimeImmutable((string) $payload->motionMetadata['retention_expires_at']) : null;
        $offlineDeviceHash = trim((string) ($payload->motionMetadata['device_id_hash'] ?? '')) ?: null;
        $deviceHash = $deviceId === null || trim($deviceId) === '' ? null : hash('sha256', $identity->companyId.'|'.$identity->workerPublicId.'|'.trim($deviceId));
        if ($deviceHash !== null && $state->device_id_hash === $deviceHash && $state->last_received_at !== null) {
            $deviceElapsed = $now->getTimestamp() - $state->last_received_at->getTimestamp();
            if ($deviceElapsed < $this->configuration->workerDeviceRateLimitSeconds()) {
                $this->publishAnomaly('MAPS_LOCATION_DEVICE_RATE_LIMITED', $identity->workerPublicId, ['elapsed_seconds'=>$deviceElapsed]);
                throw MapsIntelligenceException::fromCode('MAPS_LOCATION_DEVICE_RATE_LIMITED', 'This device is publishing location updates faster than the permitted interval.');
            }
        }

        $existingLocation = MapLocation::query()
            ->forCompany($identity->companyId)
            ->where('reference_type', 'worker')
            ->where('public_reference_id', $identity->workerPublicId)
            ->first();

        $elapsed = $state->latest_captured_at === null ? PHP_INT_MAX : $payload->capturedAt->getTimestamp() - $state->latest_captured_at->getTimestamp();
        $moved = $existingLocation === null ? INF : $this->distanceMetres(
            (float) $existingLocation->latitude,
            (float) $existingLocation->longitude,
            $payload->coordinates->latitude,
            $payload->coordinates->longitude,
        );

        if ($existingLocation !== null && $elapsed > 0 && $elapsed <= 120 && $moved > 100000.0) {
            $anomalyScore = min(100.0, round(($moved / 100000.0) * (120.0 / max(1, $elapsed)) * 50.0, 2));
            $this->signals->publish('maps.gps.anomaly.investigation', $this->signalContext(), [
                'reason_code'=>'MAPS_LOCATION_IMPOSSIBLE_JUMP','worker_public_id'=>$identity->workerPublicId,
                'anomaly_score'=>$anomalyScore,'distance_metres'=>round($moved,1),'elapsed_seconds'=>$elapsed,
            ]);
            throw MapsIntelligenceException::fromCode('MAPS_LOCATION_IMPOSSIBLE_JUMP', 'The GPS sample implies an impossible location jump and requires investigation.');
        }

        if ($existingLocation !== null
            && $elapsed < $this->configuration->minimumPingIntervalSeconds()
            && $moved < $this->configuration->minimumMovementMetres()) {
            $state->forceFill(['last_received_at' => $now])->save();
            return new WorkerLocationIngestionResult(false, true, $existingLocation, null);
        }

        $dedupeKey = $offlineSync && $clientSampleId !== ''
            ? hash('sha256', $identity->companyId.'|'.$identity->workerPublicId.'|'.$clientSampleId)
            : hash('sha256', implode('|', [
                $identity->companyId,
                $identity->workerPublicId,
                $payload->capturedAt->format('U.u'),
                number_format($payload->coordinates->latitude, 7, '.', ''),
                number_format($payload->coordinates->longitude, 7, '.', ''),
            ]));

        $result = DB::transaction(function () use ($identity, $payload, $state, $now, $dedupeKey, $deviceHash, $offlineDeviceHash, $offlineSync, $clientSampleId, $offlineClassification, $geofenceEligible, $retentionExpiresAt): WorkerLocationIngestionResult {
            $ping = MapLocationPing::query()->firstOrCreate(
                ['company_id' => $identity->companyId, 'dedupe_key' => $dedupeKey],
                [
                    'branch_id' => $identity->branchId,
                    'workspace_id' => $identity->workspaceId,
                    'worker_public_id' => $identity->workerPublicId,
                    'user_id' => $identity->userId,
                    'latitude' => $payload->coordinates->latitude,
                    'longitude' => $payload->coordinates->longitude,
                    'accuracy_metres' => $payload->accuracyMetres,
                    'altitude_metres' => $payload->altitudeMetres,
                    'speed_metres_per_second' => $payload->speedMetresPerSecond,
                    'heading_degrees' => $payload->headingDegrees,
                    'motion_metadata' => $payload->motionMetadata === [] ? null : $payload->motionMetadata,
                    'captured_at' => $payload->capturedAt,
                    'received_at' => $now,
                    'client_sample_id' => $offlineSync && $clientSampleId !== '' ? $clientSampleId : null,
                    'device_id_hash' => $offlineSync ? $offlineDeviceHash : $deviceHash,
                    'offline_sync' => $offlineSync,
                    'retention_expires_at' => $retentionExpiresAt,
                    'offline_classification' => $offlineClassification,
                    'geofence_eligible' => $geofenceEligible,
                ],
            );

            $location = MapLocation::query()->updateOrCreate(
                [
                    'company_id' => $identity->companyId,
                    'reference_type' => 'worker',
                    'public_reference_id' => $identity->workerPublicId,
                ],
                [
                    'branch_id' => $identity->branchId,
                    'workspace_id' => $identity->workspaceId,
                    'latitude' => $payload->coordinates->latitude,
                    'longitude' => $payload->coordinates->longitude,
                    'source' => 'gps',
                    'precision' => 'gps:'.rtrim(rtrim(number_format($payload->accuracyMetres, 1, '.', ''), '0'), '.').'m',
                    'provider' => 'device-gps',
                    'coordinates_verified_at' => $payload->capturedAt,
                ],
            );

            $state->forceFill([
                'branch_id' => $identity->branchId,
                'workspace_id' => $identity->workspaceId,
                'latest_location_ping_id' => $ping->id,
                'latest_captured_at' => $payload->capturedAt,
                'last_received_at' => $now,
                'device_id_hash' => $deviceHash ?? $offlineDeviceHash ?? $state->device_id_hash,
            ])->save();

            $this->audit->record([
                'event' => 'maps.worker_location.accepted',
                'company_id' => $identity->companyId,
                'worker_public_id' => $identity->workerPublicId,
                'user_id' => $identity->userId,
                'ping_id' => $ping->id,
                'captured_at' => $payload->capturedAt->format(DATE_ATOM),
                'accuracy_metres' => $payload->accuracyMetres,
            ]);

            return new WorkerLocationIngestionResult(true, false, $location->refresh(), $ping->refresh());
        });

        if ($result->stored && $result->ping !== null && (bool) ($result->ping->geofence_eligible ?? true)) {
            $this->signals->publish('maps.worker_location.accepted',$this->signalContext(),['worker_public_id'=>$identity->workerPublicId,'ping_id'=>(string)$result->ping->id,'captured_at'=>$payload->capturedAt->format(DATE_ATOM),'accuracy_metres'=>$payload->accuracyMetres]);
            $this->geofences->evaluate($result->ping);
        }

        return $result;
    }

    private function publishAnomaly(string $reasonCode,string $workerPublicId,array $evidence=[]): void
    {
        $this->signals->publish('maps.geospatial.anomaly',$this->signalContext(),['reason_code'=>$reasonCode,'worker_public_id'=>$workerPublicId,'evidence'=>$evidence]);
    }

    private function signalContext(): \App\Extensions\TitanMapsIntelligence\DTO\SpatialExecutionContext
    {
        return $this->executionContexts->current() ?? $this->contextFactory->fromInput('worker.location.ingest', []);
    }

    private function distanceMetres(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earth = 6371008.8;
        $phi1 = deg2rad($lat1);
        $phi2 = deg2rad($lat2);
        $dPhi = deg2rad($lat2 - $lat1);
        $dLambda = deg2rad($lon2 - $lon1);
        $a = sin($dPhi / 2) ** 2 + cos($phi1) * cos($phi2) * sin($dLambda / 2) ** 2;
        return $earth * 2 * atan2(sqrt($a), sqrt(max(0.0, 1.0 - $a)));
    }
}

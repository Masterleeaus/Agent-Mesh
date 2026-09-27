<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\DTO\WorkerLocationPing;
use App\Extensions\TitanMapsIntelligence\Models\MapLocation;
use App\Extensions\TitanMapsIntelligence\Models\MapLocationPing;
use App\Extensions\TitanMapsIntelligence\Models\MapWorkerTrackingState;
use App\Extensions\TitanMapsIntelligence\Services\WorkerTrackingService;
use App\Extensions\TitanMapsIntelligence\Services\WorkerLocationVisibilityPolicy;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;
use DateTimeImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class WorkerTrackingController
{
    public function __construct(
        private readonly WorkerTrackingService $tracking,
        private readonly \App\Extensions\TitanMapsIntelligence\Services\OfflineWorkerLocationSyncService $offlineSyncService,
        private readonly AuthorisedCompanyContext $context,
        private readonly MapsConfiguration $configuration,
        private readonly WorkerLocationVisibilityPolicy $workerVisibility,
    ) {}

    public function status(Request $request): JsonResponse
    {
        $data = $request->validate([
            'worker_reference' => ['nullable', 'string', 'max:191'],
            'tracking_allowed' => ['required', 'boolean'],
            'on_duty' => ['required', 'boolean'],
            'share_history_until' => ['nullable', 'date'],
        ]);
        $state = $this->tracking->setStatus(
            (bool) $data['tracking_allowed'],
            (bool) $data['on_duty'],
            $data['worker_reference'] ?? null,
            isset($data['share_history_until']) ? new DateTimeImmutable((string) $data['share_history_until']) : null,
        );

        return response()->json(['data' => $this->statePayload($state)]);
    }

    public function ingest(Request $request): JsonResponse
    {
        $data = $request->validate([
            'worker_reference' => ['nullable', 'string', 'max:191'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'accuracy_metres' => ['required', 'numeric', 'min:0', 'max:10000'],
            'captured_at' => ['required', 'date'],
            'altitude_metres' => ['nullable', 'numeric', 'between:-1000,25000'],
            'speed_metres_per_second' => ['nullable', 'numeric', 'between:0,120'],
            'heading_degrees' => ['nullable', 'numeric', 'between:0,360'],
            'motion_metadata' => ['nullable', 'array'],
            'device_id' => ['nullable', 'string', 'max:191'],
        ]);

        $result = $this->tracking->ingest(new WorkerLocationPing(
            latitude: (float) $data['latitude'],
            longitude: (float) $data['longitude'],
            accuracyMetres: (float) $data['accuracy_metres'],
            capturedAt: new DateTimeImmutable((string) $data['captured_at']),
            altitudeMetres: isset($data['altitude_metres']) ? (float) $data['altitude_metres'] : null,
            speedMetresPerSecond: isset($data['speed_metres_per_second']) ? (float) $data['speed_metres_per_second'] : null,
            headingDegrees: isset($data['heading_degrees']) ? (float) $data['heading_degrees'] : null,
            motionMetadata: (array) ($data['motion_metadata'] ?? []),
        ), $data['worker_reference'] ?? null, $data['device_id'] ?? $request->header('X-Titan-Device-Id'));

        return response()->json([
            'data' => [
                'stored' => $result->stored,
                'debounced' => $result->debounced,
                'ping_id' => $result->ping?->id,
                'location' => $this->locationPayload($result->latestLocation),
            ],
        ], $result->stored ? 201 : 200);
    }

    public function offlineSync(Request $request): JsonResponse
    {
        $data=$request->validate([
            'worker_reference'=>['nullable','string','max:191'],
            'device_id'=>['nullable','string','max:191'],
            'samples'=>['required','array','min:1','max:100'],
            'samples.*.client_sample_id'=>['required','string','max:191'],
            'samples.*.latitude'=>['required','numeric','between:-90,90'],
            'samples.*.longitude'=>['required','numeric','between:-180,180'],
            'samples.*.accuracy_metres'=>['required','numeric','min:0','max:10000'],
            'samples.*.captured_at'=>['required','date'],
            'samples.*.altitude_metres'=>['nullable','numeric','between:-1000,25000'],
            'samples.*.speed_metres_per_second'=>['nullable','numeric','between:0,120'],
            'samples.*.heading_degrees'=>['nullable','numeric','between:0,360'],
            'samples.*.motion_metadata'=>['nullable','array'],
        ]);
        $deviceId=trim((string)($data['device_id']??$request->header('X-Titan-Device-Id','')));
        return response()->json(['data'=>$this->offlineSyncService->sync((array)$data['samples'],$data['worker_reference']??null,$deviceId)]);
    }

    public function me(Request $request): JsonResponse
    {
        $data = $request->validate(['worker_reference' => ['nullable', 'string', 'max:191']]);
        $current = $this->tracking->current($data['worker_reference'] ?? null);

        return response()->json(['data' => [
            'worker_public_id' => $current['identity']->workerPublicId,
            'state' => $current['state'] ? $this->statePayload($current['state']) : null,
            'location' => $current['location'] ? $this->locationPayload($current['location']) : null,
        ]]);
    }

    public function team(): JsonResponse
    {
        $companyId = $this->context->companyId();
        $states = MapWorkerTrackingState::query()->forCompany($companyId)->where('on_duty', true)->where('tracking_allowed', true);
        if (! $this->workerVisibility->canReadCompanyWide($companyId)) {
            $states->where('user_id', $this->context->userId());
        }
        $workerIds = (clone $states)->pluck('worker_public_id')->filter()->values();
        $staleCutoff = now()->subSeconds($this->configuration->workerLocationStaleAfterSeconds());
        $locations = MapLocation::query()->forCompany($companyId)->where('reference_type', 'worker')->where('source', 'gps')
            ->where('coordinates_verified_at', '>=', $staleCutoff)->whereIn('public_reference_id', $workerIds);

        $stateByWorker = $states->get()->keyBy('worker_public_id');
        $rows = $locations->latest('coordinates_verified_at')->limit(250)->get()->map(function (MapLocation $location) use ($stateByWorker): array {
            $state = $stateByWorker->get((string) $location->public_reference_id);
            return [
                'worker_public_id' => $location->public_reference_id,
                'latitude' => (float) $location->latitude,
                'longitude' => (float) $location->longitude,
                'precision' => $location->precision,
                'captured_at' => $location->coordinates_verified_at?->toAtomString(),
                'on_duty' => (bool) ($state?->on_duty ?? false),
                'tracking_allowed' => (bool) ($state?->tracking_allowed ?? false),
            ];
        })->values();

        return response()->json(['data' => $rows]);
    }

    public function checkIns(): JsonResponse
    {
        $companyId = $this->context->companyId();
        $query = MapLocationPing::query()->forCompany($companyId)->latest('captured_at');
        if (! $this->workerVisibility->canReadCompanyWide($companyId)) {
            $query->where('user_id', $this->context->userId());
        } else {
            $sharedWorkers = MapWorkerTrackingState::query()->forCompany($companyId)
                ->where('tracking_allowed', true)
                ->where('share_history_until', '>=', now())
                ->pluck('worker_public_id');
            $query->whereIn('worker_public_id', $sharedWorkers);
        }

        return response()->json(['data' => $query->limit(100)->get()->map(static fn (MapLocationPing $ping): array => [
            'id' => $ping->id,
            'worker_public_id' => $ping->worker_public_id,
            'accuracy_metres' => (float) $ping->accuracy_metres,
            'captured_at' => $ping->captured_at?->toAtomString(),
            'received_at' => $ping->received_at?->toAtomString(),
        ])->values()]);
    }

    private function statePayload(MapWorkerTrackingState $state): array
    {
        return [
            'worker_public_id' => $state->worker_public_id,
            'tracking_allowed' => (bool) $state->tracking_allowed,
            'on_duty' => (bool) $state->on_duty,
            'latest_captured_at' => $state->latest_captured_at?->toAtomString(),
            'last_received_at' => $state->last_received_at?->toAtomString(),
            'status_changed_at' => $state->status_changed_at?->toAtomString(),
            'share_history_until' => $state->share_history_until?->toAtomString(),
        ];
    }

    private function locationPayload(MapLocation $location): array
    {
        return [
            'worker_public_id' => $location->public_reference_id,
            'latitude' => (float) $location->latitude,
            'longitude' => (float) $location->longitude,
            'precision' => $location->precision,
            'source' => $location->source,
            'captured_at' => $location->coordinates_verified_at?->toAtomString(),
        ];
    }
}

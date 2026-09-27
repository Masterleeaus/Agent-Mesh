<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\WorkerIdentityResolver;
use App\Extensions\TitanMapsIntelligence\DTO\WorkerLocationPing;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Models\MapLocationPing;
use App\Extensions\TitanMapsIntelligence\Models\MapWorkerTrackingState;
use DateTimeImmutable;

final class OfflineWorkerLocationSyncService
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly WorkerIdentityResolver $identities,
        private readonly MapsConfiguration $configuration,
        private readonly WorkerTrackingService $tracking,
    ) {}

    /** @return array<string,mixed> */
    public function sync(array $samples, ?string $requestedWorkerPublicId = null, ?string $deviceId = null): array
    {
        $maximum_batch_size=$this->configuration->offlineMaxBatchSize();
        if($samples===[]||count($samples)>$maximum_batch_size)throw MapsIntelligenceException::fromCode('MAPS_OFFLINE_BATCH_INVALID','Offline location sync requires 1-'.$maximum_batch_size.' samples.');
        $identity=$this->identities->resolve($this->context->companyId(),$this->context->userId(),$requestedWorkerPublicId);
        $state=MapWorkerTrackingState::query()->forCompany($identity->companyId)->where('worker_public_id',$identity->workerPublicId)->first();
        if($state===null||!(bool)$state->tracking_allowed)throw MapsIntelligenceException::fromCode('MAPS_TRACKING_NOT_ALLOWED','Offline GPS sync requires current worker tracking consent.');
        if(!(bool)$state->on_duty)throw MapsIntelligenceException::fromCode('MAPS_WORKER_OFF_DUTY','Offline GPS sync is only accepted while the worker remains on duty.');
        $deviceId=trim((string)$deviceId);if($deviceId==='')throw MapsIntelligenceException::fromCode('MAPS_OFFLINE_DEVICE_REQUIRED','Offline GPS sync requires a device_id.');
        $deviceHash=hash('sha256',$identity->companyId.'|'.$identity->workerPublicId.'|'.$deviceId);$receipts=[];$summary=['stored'=>0,'deduplicated'=>0,'historical_only'=>0,'live_eligible'=>0,'rejected'=>0];
        usort($samples,static fn($a,$b)=>strcmp((string)($a['captured_at']??''),(string)($b['captured_at']??'')));
        foreach($samples as $sample){
            try{$r=$this->syncOne($identity,$state,(array)$sample,$deviceHash);$receipts[]=$r;if(($r['deduplicated']??false)===true)$summary['deduplicated']++;elseif(($r['stored']??false)===true)$summary['stored']++;if(($r['historical_only']??false)===true)$summary['historical_only']++;if(($r['live_eligible']??false)===true)$summary['live_eligible']++;}
            catch(\Throwable $e){$summary['rejected']++;$receipts[]=['client_sample_id'=>(string)($sample['client_sample_id']??''),'stored'=>false,'status'=>'rejected','historical_only'=>false,'live_eligible'=>false,'error'=>$e->getMessage()];}
            $state->refresh();
        }
        return ['schema'=>'titan.maps.worker-location.offline-sync.v1','provider'=>'titan-maps-intelligence','worker_public_id'=>$identity->workerPublicId,'received_at'=>(new DateTimeImmutable('now'))->format(DATE_ATOM),'summary'=>$summary,'receipts'=>$receipts];
    }

    /** @return array<string,mixed> */
    private function syncOne(object $identity, MapWorkerTrackingState $state, array $sample, string $deviceHash): array
    {
        $clientSampleId=trim((string)($sample['client_sample_id']??''));if($clientSampleId===''||strlen($clientSampleId)>191)throw MapsIntelligenceException::fromCode('MAPS_OFFLINE_SAMPLE_ID_REQUIRED','client_sample_id is required for offline GPS idempotency.');
        try{$sampleCapturedAt=new DateTimeImmutable((string)($sample['captured_at']??''));}catch(\Throwable){throw MapsIntelligenceException::fromCode('MAPS_LOCATION_CAPTURE_INVALID','captured_at is required for offline GPS samples.');}
        $now=new DateTimeImmutable('now');$age=$now->getTimestamp()-$sampleCapturedAt->getTimestamp();
        if($age < -$this->configuration->maximumFutureSkewSeconds())throw MapsIntelligenceException::fromCode('MAPS_LOCATION_CAPTURE_FUTURE','Offline GPS sample is too far in the future.');
        if($age > $this->configuration->offlineMaxAgeDays()*86400)throw MapsIntelligenceException::fromCode('MAPS_LOCATION_CAPTURE_EXPIRED','Offline GPS sample is older than offline_max_age_days.');
        $latitude=(float)($sample['latitude']??999);$longitude=(float)($sample['longitude']??999);if($latitude < -90 || $latitude > 90 || $longitude < -180 || $longitude > 180)throw MapsIntelligenceException::fromCode('MAPS_LOCATION_COORDINATES_INVALID','Offline GPS sample latitude/longitude are outside valid coordinate bounds.');
        $accuracy=(float)($sample['accuracy_metres']??-1);if($accuracy<0||$accuracy>$this->configuration->maximumLocationAccuracyMetres())throw MapsIntelligenceException::fromCode('MAPS_LOCATION_ACCURACY_TOO_LOW','Offline GPS sample exceeds maximumLocationAccuracyMetres.');
        if($state->status_changed_at!==null && $sampleCapturedAt < new DateTimeImmutable($state->status_changed_at->toAtomString()))throw MapsIntelligenceException::fromCode('MAPS_OFFLINE_SAMPLE_BEFORE_CONSENT','Offline GPS sample predates the current tracking_allowed/on_duty consent state.');
        $dedupe_key=hash('sha256',$identity->companyId.'|'.$identity->workerPublicId.'|'.$clientSampleId);$existing=MapLocationPing::query()->forCompany($identity->companyId)->where('dedupe_key',$dedupe_key)->first();
        if($existing){
            $classification=(string)($existing->offline_classification??'');
            if($classification==='')$classification=(bool)($existing->geofence_eligible??false)?'live':'historical';
            $historical=in_array($classification,['historical','legacy_historical'],true);
            $liveEligible=in_array($classification,['live','debounced'],true);
            $status=match($classification){'live'=>'deduplicated_live','debounced'=>'deduplicated_debounced',default=>'deduplicated_historical'};
            return ['client_sample_id'=>$clientSampleId,'stored'=>false,'deduplicated'=>true,'historical_only'=>$historical,'live_eligible'=>$liveEligible,'status'=>$status,'ping_id'=>$existing->id,'captured_at'=>$existing->captured_at?->toAtomString(),'received_at'=>$existing->received_at?->toAtomString()];
        }
        $live_eligible=$age <= $this->configuration->maximumCaptureAgeSeconds() && ($state->latest_captured_at===null || $sampleCapturedAt > new DateTimeImmutable($state->latest_captured_at->toAtomString()));
        $retention_expires_at=$sampleCapturedAt->modify('+'.$this->configuration->locationRetentionDays().' days');
        $classification=$live_eligible?'live':'historical';$motion=(array)($sample['motion_metadata']??[])+['offline_sync'=>true,'client_sample_id'=>$clientSampleId,'device_id_hash'=>$deviceHash,'offline_classification'=>$classification,'geofence_eligible'=>$live_eligible,'retention_expires_at'=>$retention_expires_at->format(DATE_ATOM)];
        if($live_eligible){
            $result=$this->tracking->ingest(new WorkerLocationPing($latitude,$longitude,$accuracy,$sampleCapturedAt,isset($sample['altitude_metres'])?(float)$sample['altitude_metres']:null,isset($sample['speed_metres_per_second'])?(float)$sample['speed_metres_per_second']:null,isset($sample['heading_degrees'])?(float)$sample['heading_degrees']:null,$motion),$identity->workerPublicId,null);
            if($result->ping){
                $result->ping->forceFill(['client_sample_id'=>$clientSampleId,'device_id_hash'=>$deviceHash,'offline_sync'=>true,'retention_expires_at'=>$retention_expires_at,'offline_classification'=>'live','geofence_eligible'=>true])->save();
                return ['client_sample_id'=>$clientSampleId,'stored'=>$result->stored,'deduplicated'=>$result->deduplicated,'historical_only'=>false,'live_eligible'=>true,'status'=>$result->stored?'stored_live':'deduplicated_live','ping_id'=>$result->ping->id,'captured_at'=>$sampleCapturedAt->format(DATE_ATOM),'received_at'=>$now->format(DATE_ATOM),'retention_expires_at'=>$retention_expires_at->format(DATE_ATOM)];
            }

            // A debounce intentionally leaves the live MapLocation untouched, but offline replay still
            // needs a durable client_sample_id receipt so a later reconnect cannot reclassify the sample.
            $debouncedMotion=$motion; $debouncedMotion['offline_classification']='debounced'; $debouncedMotion['geofence_eligible']=false;
            $ping=MapLocationPing::query()->firstOrCreate(
                ['company_id'=>$identity->companyId,'dedupe_key'=>$dedupe_key],
                ['branch_id'=>$identity->branchId,'workspace_id'=>$identity->workspaceId,'worker_public_id'=>$identity->workerPublicId,'user_id'=>$identity->userId,'latitude'=>$latitude,'longitude'=>$longitude,'accuracy_metres'=>$accuracy,'altitude_metres'=>isset($sample['altitude_metres'])?(float)$sample['altitude_metres']:null,'speed_metres_per_second'=>isset($sample['speed_metres_per_second'])?(float)$sample['speed_metres_per_second']:null,'heading_degrees'=>isset($sample['heading_degrees'])?(float)$sample['heading_degrees']:null,'motion_metadata'=>$debouncedMotion,'captured_at'=>$sampleCapturedAt,'received_at'=>$now,'client_sample_id'=>$clientSampleId,'device_id_hash'=>$deviceHash,'offline_sync'=>true,'retention_expires_at'=>$retention_expires_at,'offline_classification'=>'debounced','geofence_eligible'=>false]
            );
            return ['client_sample_id'=>$clientSampleId,'stored'=>(bool)$ping->wasRecentlyCreated,'deduplicated'=>!$ping->wasRecentlyCreated,'historical_only'=>false,'live_eligible'=>true,'status'=>$ping->wasRecentlyCreated?'debounced':'deduplicated_debounced','ping_id'=>$ping->id,'captured_at'=>$sampleCapturedAt->format(DATE_ATOM),'received_at'=>$now->format(DATE_ATOM),'retention_expires_at'=>$retention_expires_at->format(DATE_ATOM)];
        }
        $ping=MapLocationPing::query()->create(['company_id'=>$identity->companyId,'branch_id'=>$identity->branchId,'workspace_id'=>$identity->workspaceId,'worker_public_id'=>$identity->workerPublicId,'user_id'=>$identity->userId,'latitude'=>$latitude,'longitude'=>$longitude,'accuracy_metres'=>$accuracy,'altitude_metres'=>isset($sample['altitude_metres'])?(float)$sample['altitude_metres']:null,'speed_metres_per_second'=>isset($sample['speed_metres_per_second'])?(float)$sample['speed_metres_per_second']:null,'heading_degrees'=>isset($sample['heading_degrees'])?(float)$sample['heading_degrees']:null,'motion_metadata'=>$motion,'captured_at'=>$sampleCapturedAt,'received_at'=>$now,'dedupe_key'=>$dedupe_key,'client_sample_id'=>$clientSampleId,'device_id_hash'=>$deviceHash,'offline_sync'=>true,'retention_expires_at'=>$retention_expires_at,'offline_classification'=>'historical','geofence_eligible'=>false]);
        return ['client_sample_id'=>$clientSampleId,'stored'=>true,'deduplicated'=>false,'historical_only'=>true,'live_eligible'=>false,'status'=>'stale_historical','ping_id'=>$ping->id,'captured_at'=>$sampleCapturedAt->format(DATE_ATOM),'received_at'=>$now->format(DATE_ATOM),'retention_expires_at'=>$retention_expires_at->format(DATE_ATOM)];
    }
}

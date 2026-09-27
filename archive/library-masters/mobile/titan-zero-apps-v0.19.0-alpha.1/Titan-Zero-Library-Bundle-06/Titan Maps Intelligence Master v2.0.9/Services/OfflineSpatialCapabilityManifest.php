<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Services;
final class OfflineSpatialCapabilityManifest
{
    public function __construct(private readonly MapsCapabilityService $capabilities) {}
    public function all(): array
    {
        $items=array_map(static fn(array $d): array=>[
            'id'=>$d['id'],'canonical_alias'=>$d['canonical_alias']??null,'offline_policy'=>$d['offline_policy'],
            'risk_profile'=>$d['risk_profile'],'autonomy_requirement'=>$d['autonomy_requirement'],'mutation_class'=>$d['mutation_class'],
            'evidence_requirements'=>$d['evidence_requirements'],'reversibility'=>$d['reversibility'],'idempotency_strategy'=>$d['idempotency_strategy'],
        ],$this->capabilities->definitions());
        $items[]=['id'=>'worker.location.offline-sync','canonical_alias'=>'titan.maps.worker-location.offline-sync','offline_policy'=>'bounded_client_queue_replay','risk_profile'=>'privacy_sensitive','autonomy_requirement'=>'authenticated_worker_current_consent_on_duty','mutation_class'=>'append_only_history_plus_fresh_live_projection','evidence_requirements'=>['client_sample_id','captured_at','accuracy_metres','device_id'],'reversibility'=>'retention_prune','idempotency_strategy'=>'company+worker+client_sample_id'];
        return $items;
    }
}

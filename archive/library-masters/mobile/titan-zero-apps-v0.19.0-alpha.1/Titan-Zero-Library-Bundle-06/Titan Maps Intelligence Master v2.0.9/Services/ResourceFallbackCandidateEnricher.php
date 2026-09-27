<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Models\DiscoveryCandidate;
use App\Extensions\TitanMapsIntelligence\Models\ResourceFallbackRequest;

final class ResourceFallbackCandidateEnricher
{
    public function __construct(private readonly ResourceFallbackScoreService $scores) {}

    /** @param array<string,mixed> $resource @return array<string,mixed> */
    public function approvedNetwork(array $resource, ResourceFallbackRequest $request): array
    {
        $serviceMatch=null;$serviceEvidence='unknown';$rating=null;$reviewCount=0;$completeness=0.5;$discoveryId=null;
        if (($resource['source']??null)==='approved_discovery_candidate' && isset($resource['public_reference_id'])) {
            $candidate=DiscoveryCandidate::query()->forCompany((string)$request->company_id)->with('place')->whereKey((string)$resource['public_reference_id'])->first();
            if($candidate?->place){
                $discoveryId=(string)$candidate->id;
                [$serviceMatch,$serviceEvidence]=$this->serviceFit($request->service_key,$candidate->place->primary_category,(array)$candidate->place->categories);
                $rating=$candidate->place->rating!==null?(float)$candidate->place->rating:null;$reviewCount=(int)($candidate->place->review_count??0);
                $completeness=$this->completeness($candidate->place->toArray());
            }
        }
        $input=[
            'source'=>'approved_network','service_match'=>$serviceMatch,'service_evidence'=>$serviceEvidence,
            'duration_seconds'=>$resource['duration_seconds']??null,'distance_metres'=>$resource['distance_metres']??null,
            'straight_line_distance_metres'=>$resource['straight_line_distance_metres']??null,'eta_basis'=>$resource['eta_basis']??'unavailable',
            'data_completeness'=>$completeness,'rating'=>$rating,'review_count'=>$reviewCount,
        ];
        $score=$this->scores->score($input);
        return [
            'source'=>'approved_network','resource_type'=>$request->resource_type,'source_reference_type'=>$request->resource_type,
            'source_public_id'=>(string)($resource['public_reference_id']??''),'discovery_candidate_id'=>$discoveryId,
            'label'=>(string)($resource['label']??ucfirst((string)$request->resource_type)),'subtitle'=>$resource['subtitle']??null,
            'latitude'=>$resource['lat']??null,'longitude'=>$resource['lng']??null,'service_match'=>$serviceMatch,'service_evidence'=>$serviceEvidence,
            'road_distance_metres'=>$resource['distance_metres']??null,'straight_line_distance_metres'=>$resource['straight_line_distance_metres']??null,
            'duration_seconds'=>$resource['duration_seconds']??null,'traffic_delay_seconds'=>$resource['traffic_delay_seconds']??null,'eta_basis'=>$resource['eta_basis']??'unavailable',
            'matrix_condition'=>$resource['condition']??null,'fit_score'=>$score->totalScore,'evidence'=>$score->evidence,'explanations'=>$score->explanations,
            'metadata'=>['nearest_source'=>$resource['source']??null,'distance_basis'=>$resource['distance_basis']??null],
        ];
    }

    /** @param object|null $element @return array<string,mixed> */
    public function discovery(DiscoveryCandidate $candidate, ResourceFallbackRequest $request, ?object $element, string $matrixBasis): array
    {
        $place=$candidate->place;
        [$serviceMatch,$serviceEvidence]=$this->serviceFit($request->service_key,$place?->primary_category,(array)($place?->categories??[]));
        $eta=$element?->duration_seconds ?? null;$road=$element?->distance_metres ?? null;$straight=$element?->straight_line_distance_metres ?? null;
        $etaBasis=$eta!==null?($matrixBasis==='stale_matrix_snapshot'?'stale_snapshot':'provider_eta'):'unavailable';
        $input=[
            'source'=>'discovery','service_match'=>$serviceMatch,'service_evidence'=>$serviceEvidence,'duration_seconds'=>$eta,'distance_metres'=>$road,
            'straight_line_distance_metres'=>$straight,'eta_basis'=>$etaBasis,'data_completeness'=>$place?$this->completeness($place->toArray()):0.0,
            'rating'=>$place?->rating,'review_count'=>$place?->review_count??0,
        ];
        $score=$this->scores->score($input);
        return [
            'source'=>'discovery','resource_type'=>$request->resource_type,'source_reference_type'=>'discovery_candidate','source_public_id'=>(string)$candidate->id,
            'discovery_candidate_id'=>(string)$candidate->id,'label'=>(string)($place?->name??'Discovered resource'),'subtitle'=>$place?->address,
            'latitude'=>$place?->latitude,'longitude'=>$place?->longitude,'service_match'=>$serviceMatch,'service_evidence'=>$serviceEvidence,
            'road_distance_metres'=>$road,'straight_line_distance_metres'=>$straight,'duration_seconds'=>$eta,'traffic_delay_seconds'=>$element?->traffic_delay_seconds,
            'eta_basis'=>$etaBasis,'matrix_condition'=>$element?->condition,'fit_score'=>$score->totalScore,'evidence'=>$score->evidence,'explanations'=>$score->explanations,
            'metadata'=>['candidate_type'=>$candidate->candidate_type,'candidate_review_status'=>$candidate->review_status,'matrix_basis'=>$matrixBasis],
        ];
    }

    /** @return array{0:?float,1:string} */
    private function serviceFit(?string $serviceKey, ?string $primaryCategory, array $categories): array
    {
        $service=$this->normalise((string)$serviceKey);if($service==='')return [null,'unknown'];
        $values=array_values(array_filter(array_map(fn($v)=>$this->normalise((string)$v),[$primaryCategory,...$categories])));
        if($values===[])return [null,'unknown'];
        foreach($values as $value){if($value===$service || str_contains($value,$service) || str_contains($service,$value))return [1.0,'explicit_category'];}
        return [0.0,'explicit_category'];
    }

    /** @param array<string,mixed> $place */
    private function completeness(array $place): float
    {
        $checks=[!empty($place['phone']),!empty($place['website']),!empty($place['address']),!empty($place['categories'])||!empty($place['primary_category'])];
        return array_sum(array_map(static fn(bool $v):int=>$v?1:0,$checks))/count($checks);
    }
    private function normalise(string $value): string { $value=strtolower(trim($value));$value=preg_replace('/[^a-z0-9]+/',' ',$value)??'';return trim($value); }
}

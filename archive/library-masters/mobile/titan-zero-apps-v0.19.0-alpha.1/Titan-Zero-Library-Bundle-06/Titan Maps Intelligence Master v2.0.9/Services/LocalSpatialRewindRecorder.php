<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Services;
use App\Extensions\TitanMapsIntelligence\Contracts\AuditRecorder;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialRewindRecorder;
use App\Extensions\TitanMapsIntelligence\DTO\SpatialDecisionReceipt;
final class LocalSpatialRewindRecorder implements SpatialRewindRecorder
{
    public function __construct(private readonly AuditRecorder $audit) {}
    public function record(SpatialDecisionReceipt $receipt): ?string
    {
        $id='maps-local-rewind-'.substr(hash('sha256',$receipt->receiptId.'|'.$receipt->traceId),0,24);
        $this->audit->record(['record_type'=>'spatial_rewind_fallback','rewind_reference'=>$id,'receipt'=>$receipt->toArray(),'platform_rewind_recorded'=>false]);
        return $id;
    }
}

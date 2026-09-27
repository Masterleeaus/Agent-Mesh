<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Console;

use App\Extensions\TitanMapsIntelligence\Contracts\AuditRecorder;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialSignalPublisher;
use App\Extensions\TitanMapsIntelligence\DTO\SpatialExecutionContext;
use App\Extensions\TitanMapsIntelligence\Models\ResourceFallbackRequest;
use Illuminate\Console\Command;

final class EscalateResourceFallbacksCommand extends Command
{
    protected $signature = 'titan-maps:escalate-resource-fallbacks {--limit=500}';
    protected $description = 'Escalate contractor/supplier fallback requests whose human review deadline expired.';

    public function handle(SpatialSignalPublisher $signals, AuditRecorder $audit): int
    {
        $limit=max(1,min(5000,(int)$this->option('limit'))); $count=0;
        ResourceFallbackRequest::query()
            ->whereIn('status',['approved_network_review','discovery_review','approved'])
            ->whereNull('closed_at')->whereNull('escalated_at')->whereNotNull('review_due_at')->where('review_due_at','<=',now())
            ->orderBy('review_due_at')->limit($limit)->get()->each(function(ResourceFallbackRequest $request) use($signals,$audit,&$count): void {
                $request->forceFill(['escalated_at'=>now(),'metadata'=>array_merge((array)$request->metadata,['review_escalation'=>'human_review_timeout'])])->save();
                $trace='fallback-escalation-'.(string)$request->id;
                $context=new SpatialExecutionContext($trace,$trace,null,(string)$request->company_id,null,null,null,'maps.resource_fallback.review_timeout','system');
                $signals->publish('maps.resource_fallback.review_timeout',$context,[
                    'fallback_request_id'=>(string)$request->id,'resource_type'=>$request->resource_type,
                    'operational_need_type'=>$request->operational_need_type,'operational_need_public_id'=>$request->operational_need_public_id,
                    'review_due_at'=>$request->review_due_at?->toAtomString(),
                ]);
                $audit->record(['type'=>'resource_fallback.review_timeout','company_id'=>(string)$request->company_id,'entity_type'=>'resource_fallback_request','entity_id'=>(string)$request->id,'review_due_at'=>$request->review_due_at?->toAtomString()]);
                $count++;
            });
        $this->info("Escalated {$count} resource fallback request(s).");
        return self::SUCCESS;
    }
}

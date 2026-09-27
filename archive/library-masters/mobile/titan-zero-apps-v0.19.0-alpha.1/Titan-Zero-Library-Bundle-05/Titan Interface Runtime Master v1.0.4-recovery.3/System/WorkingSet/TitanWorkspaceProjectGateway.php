<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\WorkingSet;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\WorkingSet\WorkingSetGatewayContract;

final readonly class TitanWorkspaceProjectGateway implements WorkingSetGatewayContract
{
    public function __construct(private int $maxItems = 200) {}

    public function inspect(string $workingSetId, InterfaceContext $context): WorkingSetSourceResult
    {
        if (preg_match('/^[1-9][0-9]{0,18}$/',$workingSetId)!==1) throw new WorkingSetWorkspaceException('Working set identifier is invalid.');
        $model='App\\Models\\TitanWorkspaceProject';
        if (! class_exists($model)) throw new WorkingSetWorkspaceException('Titan Workspace Project source is unavailable.');
        try {
            $query=$model::query()->where('id',(int)$workingSetId)->where('user_id',$context->userId);
            $limit=max(1,min(500,$this->maxItems));
            $record=$query->with(['items'=>static fn($q)=>$q->latest()->limit($limit)])->first();
        } catch (\Throwable $e) {
            throw new WorkingSetWorkspaceException('Titan Workspace Project source could not be read.',0,$e);
        }
        if (! is_object($record)) throw new WorkingSetWorkspaceException('Working set is unavailable for the authenticated user.');
        $items=[];
        foreach (($record->items??[]) as $item) {
            $items[]=new WorkingSetSourceItem(
                membershipId:(string)($item->id??''),itemType:(string)($item->item_type??''),itemId:(string)($item->item_id??''),
                title:isset($item->title)?(string)$item->title:null,meta:$this->safeMeta($item->meta_json??[]),
                updatedAt:isset($item->updated_at)?(string)$item->updated_at:null,
            );
        }
        return new WorkingSetSourceResult(
            sourceAuthority:'titan-workspace-projects',status:$items===[]?'empty':'ready',workingSetId:(string)$record->id,
            ownerUserId:(string)$record->user_id,teamId:isset($record->team_id)?(string)$record->team_id:null,name:(string)$record->name,
            description:isset($record->description)?(string)$record->description:null,context:$this->safeContext($record->context_json??[]),items:$items,
            diagnostics:['source'=>'App\\Models\\TitanWorkspaceProject','read_only'=>true,'max_items'=>$this->maxItems],
        );
    }

    public function health(): array
    {
        $model='App\\Models\\TitanWorkspaceProject';$item='App\\Models\\TitanWorkspaceProjectItem';$service='App\\Services\\TitanWorkspaceProjectService';
        return ['status'=>class_exists($model)&&class_exists($item)?'healthy':'unavailable','authority'=>'titan-workspace-projects','model_available'=>class_exists($model),'item_model_available'=>class_exists($item),'service_available'=>class_exists($service),'read_only'=>true];
    }

    /** @return array<string,mixed> */
    private function safeContext(mixed $value): array
    {
        if (! is_array($value)) return [];
        $allowed=[];foreach(['business_id','customer_id','property_id','job_id','work_order_id','quote_id','invoice_id','technician_id','asset_id','vertical','workflow_stage','imported_from','source_folder_id'] as$key){$v=$value[$key]??null;if(is_scalar($v)&&$v!=='')$allowed[$key]=(string)$v;}return$allowed;
    }

    /** @return array<string,mixed> */
    private function safeMeta(mixed $value): array
    {
        if (! is_array($value)) return [];
        $allowed=[];foreach(['source','slug','path','url','mime','size','filename'] as$key){$v=$value[$key]??null;if(is_scalar($v)&&$v!=='')$allowed[$key]=(string)$v;}return$allowed;
    }
}

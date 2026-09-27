<?php

declare(strict_types=1);
namespace App\Extensions\TitanInterfaceRuntime\System\Host;

use Illuminate\Contracts\Foundation\Application;

/** Modern MenuContributionRegistry first; MagicAI menus table fallback. Existing administrator order/enabled state is preserved. */
final class TitanHostMenuCompatibilityAdapter
{
    /** @var array<string,mixed> */
    private array $lastStatus=['mode'=>'not-run','registered'=>false,'cache_regenerated'=>false];

    public function __construct(private readonly Application $app) {}

    /** @return array<string,mixed> */
    public function sync(): array
    {
        if ($this->registerModern()) return $this->lastStatus;
        return $this->lastStatus=$this->legacySyncHierarchy(TitanInterfaceRuntimeMenuContributor::definitions());
    }

    /** @return array<string,mixed> */
    public function status(): array { return $this->lastStatus; }

    public function remove(): void
    {
        try {
            $db=$this->app->make('db')->connection();
            $schema=$db->getSchemaBuilder();
            if(!$schema->hasTable('menus') || !$schema->hasColumn('menus','key')) return;
            $db->table('menus')->whereIn('key',TitanInterfaceRuntimeMenuContributor::keys())->delete();
            $this->regenerate();
        } catch (\Throwable) {
            // Uninstall cleanup is best-effort and must not break host uninstall.
        }
    }

    private function registerModern(): bool
    {
        $class='App\\Support\\Extensions\\MenuContributionRegistry';
        $binding=null;
        foreach([$class,'MenuContributionRegistry'] as $candidate){ if($this->app->bound($candidate)){ $binding=$candidate; break; } }
        if($binding===null && !class_exists($class)) return false;
        try {
            $registry=$this->app->make($binding ?? $class);
            if(!method_exists($registry,'register')) return false;
            try {
                $registry->register('titan-interface-runtime', TitanInterfaceRuntimeMenuContributor::class, 100);
            } catch (\ArgumentCountError|\TypeError) {
                $registry->register([
                    'key'=>'titan-interface-runtime',
                    'contributor'=>TitanInterfaceRuntimeMenuContributor::class,
                    'priority'=>100,
                ]);
            }
            return (bool)($this->lastStatus=['mode'=>'registry','registered'=>true,'cache_regenerated'=>false,'items'=>count(TitanInterfaceRuntimeMenuContributor::definitions())]);
        } catch (\Throwable $e) {
            $this->lastStatus=['mode'=>'registry-failed','registered'=>false,'cache_regenerated'=>false,'error'=>get_class($e)];
            return false;
        }
    }

    /** @param list<array<string,mixed>> $definitions @return array<string,mixed> */
    private function legacySyncHierarchy(array $definitions): array
    {
        try {
            $db=$this->app->make('db')->connection();
            $schema=$db->getSchemaBuilder();
            if(!$schema->hasTable('menus') || !$schema->hasColumn('menus','key')) return ['mode'=>'unsupported','registered'=>false,'cache_regenerated'=>false];
            $columns=array_fill_keys($schema->getColumnListing('menus'),true);
            $parentIds=[];
            $inserted=0;
            $updated=0;

            foreach($definitions as $definition){
                $parentKey=$definition['parent_key'] ?? null;
                $parentId=null;
                if(is_string($parentKey) && $parentKey!==''){
                    $parentId=$parentIds[$parentKey] ?? $db->table('menus')->where('key',$parentKey)->value('id');
                    if($parentId===null) continue;
                }

                $existing=$db->table('menus')->where('key',(string)$definition['key'])->first();
                $this->legacyUpsertPreserveAdminState($definition,$columns,$parentId,$existing);
                $existing ? $updated++ : $inserted++;

                if($parentKey===null){
                    $parentIds[(string)$definition['key']]=$db->table('menus')->where('key',(string)$definition['key'])->value('id');
                }
            }

            $regenerated=$this->regenerate();
            return [
                'mode'=>'legacy-db','registered'=>true,'items'=>count($definitions),'inserted'=>$inserted,'updated'=>$updated,
                'preserved_admin_order'=>true,'preserved_enabled_state'=>true,'cache_regenerated'=>$regenerated,
            ];
        } catch (\Throwable $e) {
            return ['mode'=>'legacy-failed','registered'=>false,'cache_regenerated'=>false,'error'=>get_class($e)];
        }
    }

    /** @param array<string,mixed> $definition @param array<string,bool> $columns */
    private function legacyUpsertPreserveAdminState(array $definition,array $columns,mixed $parentId,mixed $existing): void
    {
        $db=$this->app->make('db')->connection();
        $now=function_exists('now')?now():date('Y-m-d H:i:s');
        $payload=[
            'route'=>$definition['route']??null,
            'route_slug'=>$definition['route_slug']??null,
            'label'=>$definition['label']??$definition['key'],
            'icon'=>$this->safeIcon((string)($definition['icon']??'')),
            'svg'=>null,
            'params'=>'[]',
            'type'=>$definition['type']??'item',
            'badge'=>null,
            'extension'=>'1',
            'bolt_menu'=>0,'bolt_background'=>null,'bolt_foreground'=>null,
            'letter_icon'=>0,'letter_icon_bg'=>null,'custom_menu'=>0,
            'updated_at'=>$now,
        ];
        $payload=array_intersect_key($payload,$columns);

        // Child membership is extension-owned; ordering and enabled state remain administrator-owned.
        if(($definition['parent_key']??null)!==null && isset($columns['parent_id'])) $payload['parent_id']=$parentId;
        foreach(['order','sort','position','enabled','status','is_active'] as $preserve) unset($payload[$preserve]);
        if(($definition['parent_key']??null)===null) unset($payload['parent_id']);

        $query=$db->table('menus')->where('key',(string)$definition['key']);
        if($existing){
            $query->update($payload);
            return;
        }

        $insert=['key'=>$definition['key']]+$payload;
        if(isset($columns['parent_id'])) $insert['parent_id']=$parentId;
        if(isset($columns['order'])) $insert['order']=(int)($definition['order']??0);
        if(isset($columns['is_active'])) $insert['is_active']=1;
        if(isset($columns['is_admin'])) $insert['is_admin']=0;
        if(isset($columns['created_at'])) $insert['created_at']=$now;
        $db->table('menus')->insert(array_intersect_key($insert,$columns));
    }

    private function regenerate(): bool
    {
        $class='App\\Services\\Common\\MenuService';
        if(!class_exists($class)) return false;
        try { $service=$this->app->make($class); if(method_exists($service,'regenerate')){ $service->regenerate(); return true; } } catch(\Throwable) {}
        return false;
    }

    private function safeIcon(string $icon): string
    {
        return in_array($icon,['tabler-layout-dashboard','tabler-folders','tabler-command','tabler-components'],true)?$icon:'tabler-folders';
    }
}

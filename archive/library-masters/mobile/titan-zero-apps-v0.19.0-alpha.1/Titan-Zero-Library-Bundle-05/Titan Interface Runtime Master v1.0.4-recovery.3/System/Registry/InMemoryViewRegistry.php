<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ViewRegistryContract;

final class InMemoryViewRegistry implements ViewRegistryContract
{
    private ViewRegistrySnapshot $snapshot;
    public function __construct(private readonly ?ObjectRegistryContract $objects = null) { $this->snapshot = new ViewRegistrySnapshot([], []); }

    public function rebuild(array $contributions): ViewRegistrySnapshot
    {
        $candidates=[]; $owners=[]; $collisions=[]; $rejected=[];
        foreach ($contributions as $contributorKey => $contribution) {
            foreach ((array)($contribution['views'] ?? []) as $raw) {
                try {
                    $view=$this->normalize((string)$contributorKey, $raw);
                    if (isset($owners[$view->key])) {
                        $collisions[$view->key]=array_values(array_unique([$owners[$view->key],$view->contributorKey]));
                        unset($candidates[$view->key]);
                        continue;
                    }
                    $owners[$view->key]=$view->contributorKey; $candidates[$view->key]=$view;
                } catch (\Throwable $e) { $rejected[(string)$contributorKey][]=$e->getMessage(); }
            }
        }
        foreach (array_keys($collisions) as $key) unset($candidates[$key]);
        $byObject=[];
        foreach ($candidates as $key=>$view) {
            $valid=true;
            if ($this->objects !== null) {
                foreach ($view->appliesTo as $objectKey) {
                    if ($this->objects->get($objectKey) === null) { $rejected[$view->contributorKey][]="View {$key} targets unknown object {$objectKey}."; $valid=false; }
                }
            }
            if (! $valid) { unset($candidates[$key]); continue; }
            foreach ($view->appliesTo as $objectKey) $byObject[$objectKey][]=$key;
        }
        ksort($candidates,SORT_STRING); ksort($byObject,SORT_STRING); ksort($collisions,SORT_STRING); ksort($rejected,SORT_STRING);
        foreach ($byObject as &$keys) sort($keys,SORT_STRING); unset($keys);
        return $this->snapshot=new ViewRegistrySnapshot($candidates,$byObject,$collisions,$rejected);
    }

    public function find(string $key): ?ViewDescriptor { return $this->snapshot->views[$key] ?? null; }
    public function forObject(string $objectKey): array { return array_values(array_filter(array_map(fn($k)=>$this->find($k),$this->snapshot->byObject[$objectKey]??[]))); }
    public function snapshot(): ViewRegistrySnapshot { return $this->snapshot; }

    private function normalize(string $contributorKey, mixed $raw): ViewDescriptor
    {
        if (! is_array($raw)) throw new \InvalidArgumentException('View declaration must be an object.');
        foreach (['key','label','kind','applies_to','product_surfaces','customer_safe','permissions','data_source'] as $required) if (! array_key_exists($required,$raw)) throw new \InvalidArgumentException("View is missing {$required}.");
        if (! is_array($raw['data_source'])) throw new \InvalidArgumentException('View data_source must be an object.');
        foreach (['authority','mode','reference'] as $required) if (! isset($raw['data_source'][$required]) || ! is_string($raw['data_source'][$required])) throw new \InvalidArgumentException("View data_source is missing {$required}.");
        $mode=(string)$raw['data_source']['mode'];
        if (! in_array($mode,['read-model','capability','legacy-route'],true)) throw new \InvalidArgumentException("View has unsupported data mode {$mode}.");
        return new ViewDescriptor(
            $contributorKey,(string)$raw['key'],(string)$raw['label'],(string)$raw['kind'],
            self::strings($raw['applies_to'],'applies_to'),self::strings($raw['product_surfaces'],'product_surfaces'),
            (bool)$raw['customer_safe'],self::strings($raw['permissions'],'permissions'),
            (string)$raw['data_source']['authority'],$mode,(string)$raw['data_source']['reference'],
            isset($raw['component_hint']) && is_string($raw['component_hint']) ? $raw['component_hint'] : null,
        );
    }

    private static function strings(mixed $value,string $field): array
    {
        if (! is_array($value)) throw new \InvalidArgumentException("View {$field} must be an array.");
        $out=[]; foreach ($value as $item) { if (! is_string($item)||$item==='') throw new \InvalidArgumentException("View {$field} contains an invalid value."); $out[]=$item; }
        return array_values(array_unique($out));
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Spatial;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;

final readonly class SpatialPayloadNormalizer
{
    public const MAX_LAYERS = 50;
    public const MAX_PINS = 1000;
    public const MAX_CANDIDATES = 500;
    public const MAX_ROUTES = 100;
    public const MAX_TERRITORIES = 100;
    public const MAX_TRAFFIC = 500;
    public const MAX_VERTICES_PER_GEOMETRY = 5000;

    private const LAYER_KINDS = ['points','polygons','lines','routes','traffic','candidates','heatmap','custom'];
    private const TRAFFIC_SEVERITIES = ['free','light','moderate','heavy','severe','unknown'];

    public function __construct(private ObjectRegistryContract $objects)
    {
    }

    /**
     * @param array<string,mixed>|list<mixed> $payload
     * @return array{layers:list<array<string,mixed>>,pins:list<array<string,mixed>>,candidates:list<array<string,mixed>>,routes:list<array<string,mixed>>,territories:list<array<string,mixed>>,traffic:list<array<string,mixed>>,diagnostics:array<string,mixed>}
     */
    public function normalize(array $payload, InterfaceContext $context): array
    {
        $diagnostics = ['omitted'=>['layers'=>0,'pins'=>0,'candidates'=>0,'routes'=>0,'territories'=>0,'traffic'=>0],'truncated'=>[]];

        $layers = $this->boundedList($payload['layers'] ?? [], self::MAX_LAYERS, 'layers', $diagnostics, fn(array $item): ?array => $this->layer($item));
        $pins = $this->boundedList($payload['pins'] ?? [], self::MAX_PINS, 'pins', $diagnostics, fn(array $item): ?array => $this->pin($item, $context));
        $candidates = $this->boundedList($payload['candidates'] ?? [], self::MAX_CANDIDATES, 'candidates', $diagnostics, fn(array $item): ?array => $this->candidate($item, $context));
        $routes = $this->boundedList($payload['routes'] ?? [], self::MAX_ROUTES, 'routes', $diagnostics, fn(array $item): ?array => $this->route($item));
        $territories = $this->boundedList($payload['territories'] ?? [], self::MAX_TERRITORIES, 'territories', $diagnostics, fn(array $item): ?array => $this->territory($item));
        $traffic = $this->boundedList($payload['traffic'] ?? [], self::MAX_TRAFFIC, 'traffic', $diagnostics, fn(array $item): ?array => $this->traffic($item));

        return compact('layers','pins','candidates','routes','territories','traffic','diagnostics');
    }

    /** @param array<string,mixed> $diagnostics @return list<array<string,mixed>> */
    private function boundedList(mixed $value, int $limit, string $kind, array &$diagnostics, callable $normalizer): array
    {
        if (! is_array($value) || ! array_is_list($value)) {
            if ($value !== null && $value !== []) $diagnostics['omitted'][$kind]++;
            return [];
        }
        if (count($value) > $limit) $diagnostics['truncated'][$kind] = ['received'=>count($value),'limit'=>$limit];
        $out=[];
        foreach (array_slice($value, 0, $limit) as $item) {
            if (! is_array($item) || array_is_list($item)) { $diagnostics['omitted'][$kind]++; continue; }
            $normalized=$normalizer($item);
            if ($normalized===null) { $diagnostics['omitted'][$kind]++; continue; }
            $out[]=$normalized;
        }
        return $out;
    }

    /** @param array<string,mixed> $item @return array<string,mixed>|null */
    private function layer(array $item): ?array
    {
        $key=$this->token($item['key'] ?? null, 128); $label=$this->text($item['label'] ?? null, 160); $kind=$this->token($item['kind'] ?? null, 40);
        if ($key===null || $label===null || $kind===null || ! in_array($kind,self::LAYER_KINDS,true)) return null;
        return ['key'=>$key,'label'=>$label,'kind'=>$kind,'visible'=>($item['visible'] ?? true)===true];
    }

    /** @param array<string,mixed> $item @return array<string,mixed>|null */
    private function pin(array $item, InterfaceContext $context): ?array
    {
        $id=$this->id($item['id'] ?? null); $label=$this->text($item['label'] ?? null,200); $coord=$this->coordinate($item);
        if ($id===null || $label===null || $coord===null) return null;
        $objectRef=null;
        if (isset($item['object_ref'])) {
            if (! is_string($item['object_ref'])) return null;
            try {
                $resolved=$this->objects->resolve(ObjectReference::parse($item['object_ref']),$context);
                $objectRef=$resolved->reference->canonical();
            } catch (\Throwable) { return null; }
        }
        $out=['id'=>$id,'label'=>$label,'lat'=>$coord['lat'],'lng'=>$coord['lng']];
        if ($objectRef!==null) $out['object_ref']=$objectRef;
        if (($layer=$this->token($item['layer'] ?? null,128))!==null) $out['layer']=$layer;
        if (($status=$this->token($item['status'] ?? null,80))!==null) $out['status']=$status;
        return $out;
    }

    /** @param array<string,mixed> $item @return array<string,mixed>|null */
    private function candidate(array $item, InterfaceContext $context): ?array
    {
        $base=$this->pin($item,$context);
        if ($base===null) return null;
        if (isset($item['confidence']) && is_numeric($item['confidence'])) {
            $confidence=(float)$item['confidence']; if ($confidence>=0.0 && $confidence<=1.0) $base['confidence']=$confidence;
        }
        if (($type=$this->token($item['candidate_type'] ?? null,100))!==null) $base['candidate_type']=$type;
        return $base;
    }

    /** @param array<string,mixed> $item @return array<string,mixed>|null */
    private function route(array $item): ?array
    {
        $id=$this->id($item['id'] ?? null); $label=$this->text($item['label'] ?? $item['id'] ?? null,200);
        $path=$this->geometry($item['path'] ?? null,2,false);
        if ($id===null || $label===null || $path===null) return null;
        $out=['id'=>$id,'label'=>$label,'path'=>$path];
        if (isset($item['distance_metres']) && is_numeric($item['distance_metres']) && (float)$item['distance_metres']>=0) $out['distance_metres']=(float)$item['distance_metres'];
        if (isset($item['duration_seconds']) && is_numeric($item['duration_seconds']) && (float)$item['duration_seconds']>=0) $out['duration_seconds']=(float)$item['duration_seconds'];
        if (($provider=$this->token($item['provider'] ?? null,100))!==null) $out['provider']=$provider;
        return $out;
    }

    /** @param array<string,mixed> $item @return array<string,mixed>|null */
    private function territory(array $item): ?array
    {
        $id=$this->id($item['id'] ?? null); $label=$this->text($item['label'] ?? $item['id'] ?? null,200);
        $polygon=$this->geometry($item['polygon'] ?? null,4,true);
        if ($id===null || $label===null || $polygon===null) return null;
        $out=['id'=>$id,'label'=>$label,'polygon'=>$polygon];
        if (($type=$this->token($item['analysis_type'] ?? null,100))!==null) $out['analysis_type']=$type;
        return $out;
    }

    /** @param array<string,mixed> $item @return array<string,mixed>|null */
    private function traffic(array $item): ?array
    {
        $id=$this->id($item['id'] ?? null); $routeId=$this->id($item['route_id'] ?? null); $severity=$this->token($item['severity'] ?? 'unknown',40);
        if ($id===null || $routeId===null || $severity===null || ! in_array($severity,self::TRAFFIC_SEVERITIES,true)) return null;
        $out=['id'=>$id,'route_id'=>$routeId,'severity'=>$severity];
        if (isset($item['delay_seconds']) && is_numeric($item['delay_seconds']) && (float)$item['delay_seconds']>=0) $out['delay_seconds']=(float)$item['delay_seconds'];
        $path=$this->geometry($item['path'] ?? null,2,false); if ($path!==null) $out['path']=$path;
        return $out;
    }

    /** @return list<array{lat:float,lng:float}>|null */
    private function geometry(mixed $value, int $minimum, bool $closed): ?array
    {
        if (! is_array($value) || ! array_is_list($value) || count($value)<$minimum || count($value)>self::MAX_VERTICES_PER_GEOMETRY) return null;
        $out=[];
        foreach ($value as $point) {
            if (! is_array($point) || array_is_list($point) || ($coord=$this->coordinate($point))===null) return null;
            $out[]=$coord;
        }
        if ($closed && $out[0]!==$out[count($out)-1]) return null;
        return $out;
    }

    /** @param array<string,mixed> $item @return array{lat:float,lng:float}|null */
    private function coordinate(array $item): ?array
    {
        $lat=$item['lat'] ?? $item['latitude'] ?? null; $lng=$item['lng'] ?? $item['longitude'] ?? null;
        if (! is_numeric($lat) || ! is_numeric($lng)) return null;
        $lat=(float)$lat; $lng=(float)$lng;
        if (! is_finite($lat) || ! is_finite($lng) || $lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) return null;
        return ['lat'=>$lat,'lng'=>$lng];
    }

    private function id(mixed $value): ?string
    {
        if ((! is_string($value) && ! is_int($value)) || ($value=(string)$value)==='' || strlen($value)>128 || preg_match('/^[A-Za-z0-9][A-Za-z0-9._~-]{0,127}$/',$value)!==1) return null;
        return $value;
    }

    private function token(mixed $value, int $max): ?string
    {
        if (! is_string($value) || $value==='' || strlen($value)>$max || preg_match('/^[A-Za-z0-9][A-Za-z0-9._:-]*$/',$value)!==1) return null;
        return $value;
    }

    private function text(mixed $value, int $max): ?string
    {
        if (! is_string($value)) return null; $value=trim($value);
        if ($value==='' || strlen($value)>$max || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/',$value)===1) return null;
        return $value;
    }
}

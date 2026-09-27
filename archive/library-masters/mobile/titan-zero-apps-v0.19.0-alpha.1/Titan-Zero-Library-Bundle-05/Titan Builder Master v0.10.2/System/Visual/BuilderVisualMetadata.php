<?php
declare(strict_types=1);
namespace App\Extensions\TitanBuilder\System\Visual;

use InvalidArgumentException;

final class BuilderVisualMetadata
{
    public const KEYS=[
        'visualTreatment','motionPreset','transitionPreset','assetRole','iconRole','mediaRole',
        'loadingTreatment','emptyTreatment','errorTreatment','densityRules','reducedMotionFallback',
        'contrastRules','visualCapabilityRequirements','resourcePolicy','visualPriority',
        'capabilityFallbackOrder'
    ];

    private const AUTHORITY_KEYS=[
        'permission','permissions','authorization','authorisation','entitlement','autonomy',
        'risk','cost','privacy','capability','capabilities','sql','credentials','credential',
        'token','secret'
    ];

    public function normalise(array $input): array
    {
        foreach(array_keys($input) as $key) {
            if(!in_array($key,self::KEYS,true)) throw new InvalidArgumentException("Unsupported visual metadata key: {$key}");
        }

        $out=[];
        foreach(self::KEYS as $k) if(array_key_exists($k,$input)) $out[$k]=$input[$k];

        $this->validate($out);
        ksort($out,SORT_STRING);
        return $out;
    }

    public function validate(array $m): void
    {
        $blob=json_encode($m,JSON_THROW_ON_ERROR|JSON_UNESCAPED_SLASHES);
        if(strlen($blob)>32768) throw new InvalidArgumentException('Visual metadata too large');
        if(preg_match('/(?:javascript:|vbscript:|<script|eval\s*\(|new\s+Function|data:text\/html|expression\s*\()/i',$blob)) {
            throw new InvalidArgumentException('Executable visual metadata rejected');
        }

        $this->walk($m,0);

        foreach(['visualTreatment','motionPreset','transitionPreset','assetRole','iconRole','mediaRole','loadingTreatment','emptyTreatment','errorTreatment'] as $key) {
            if(isset($m[$key]) && !is_string($m[$key])) throw new InvalidArgumentException("{$key} must be a string");
        }

        if(isset($m['visualCapabilityRequirements'])){
            if(!is_array($m['visualCapabilityRequirements'])) throw new InvalidArgumentException('visualCapabilityRequirements must be an array');
            foreach($m['visualCapabilityRequirements'] as $cap) {
                if(!is_string($cap)||!preg_match('/^[a-z0-9][a-z0-9._-]{0,63}$/',$cap)) throw new InvalidArgumentException('Invalid visual capability requirement');
            }
        }

        if(isset($m['capabilityFallbackOrder'])){
            if(!is_array($m['capabilityFallbackOrder']) || count($m['capabilityFallbackOrder'])>16) throw new InvalidArgumentException('Invalid capability fallback order');
            foreach($m['capabilityFallbackOrder'] as $cap) {
                if(!is_string($cap)||!preg_match('/^[a-z0-9][a-z0-9._-]{0,63}$/',$cap)) throw new InvalidArgumentException('Invalid fallback capability');
            }
        }

        if(isset($m['visualPriority']) && (!is_int($m['visualPriority']) || $m['visualPriority'] < -1000 || $m['visualPriority'] > 1000)) {
            throw new InvalidArgumentException('visualPriority out of range');
        }

        if(isset($m['resourcePolicy'])){
            if(!is_array($m['resourcePolicy'])) throw new InvalidArgumentException('resourcePolicy must be an object');
            $allowed=['cacheMode','maxAgeSeconds','integrityRequired'];
            foreach(array_keys($m['resourcePolicy']) as $key) if(!in_array($key,$allowed,true)) throw new InvalidArgumentException("Unsupported resourcePolicy key: {$key}");
            if(isset($m['resourcePolicy']['cacheMode']) && !in_array($m['resourcePolicy']['cacheMode'],['default','prefer-offline','no-cache'],true)) throw new InvalidArgumentException('Invalid cacheMode');
            if(isset($m['resourcePolicy']['maxAgeSeconds']) && (!is_int($m['resourcePolicy']['maxAgeSeconds']) || $m['resourcePolicy']['maxAgeSeconds']<0 || $m['resourcePolicy']['maxAgeSeconds']>604800)) throw new InvalidArgumentException('Invalid maxAgeSeconds');
            if(isset($m['resourcePolicy']['integrityRequired']) && !is_bool($m['resourcePolicy']['integrityRequired'])) throw new InvalidArgumentException('integrityRequired must be boolean');
        }

        foreach(['densityRules','reducedMotionFallback','contrastRules'] as $key) {
            if(isset($m[$key])&&!is_array($m[$key])) throw new InvalidArgumentException("{$key} must be an object");
        }
    }

    private function walk(array $value,int $depth): void
    {
        if($depth>12) throw new InvalidArgumentException('Visual metadata nesting too deep');
        foreach($value as $k=>$v){
            $key=strtolower((string)$k);
            if(in_array($key,self::AUTHORITY_KEYS,true)||in_array($key,['script','javascript','html','css','eval','rawurl','raw_url'],true)) {
                throw new InvalidArgumentException("Forbidden visual key: {$k}");
            }
            if(is_array($v)) $this->walk($v,$depth+1);
        }
    }
}

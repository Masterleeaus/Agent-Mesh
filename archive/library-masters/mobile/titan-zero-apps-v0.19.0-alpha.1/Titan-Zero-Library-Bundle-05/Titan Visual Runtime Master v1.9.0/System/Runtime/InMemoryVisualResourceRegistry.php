<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Runtime;
use App\Extensions\TitanVisualRuntime\System\Contracts\{VisualResourceRegistry,VisualEnvironment};
final class InMemoryVisualResourceRegistry implements VisualResourceRegistry {
    private array $assets=[]; private array $icons=[]; private array $media=[];
    public function __construct(private readonly VisualMetadataGuard $guard) {}
    public function registerAsset(string $role,array $definition): void { $this->assets[$this->role($role)]=$this->definition($definition,'asset'); }
    public function registerIcon(string $role,array $definition): void { $this->icons[$this->role($role)]=$this->definition($definition,'icon'); }
    public function registerMedia(string $role,array $definition): void { $this->media[$this->role($role)]=$this->definition($definition,'media'); }
    public function resolveAsset(string $role,VisualEnvironment $environment,array $context=[]): ?array { return $this->resolveFrom($this->assets,$role,$environment,$context); }
    public function inventory(): array { return ['assets'=>array_keys($this->assets),'icons'=>array_keys($this->icons),'media'=>array_keys($this->media)]; }
    private function role(string $role): string { if(!preg_match('/^[a-z0-9][a-z0-9._-]{1,127}$/',$role)) throw new \InvalidArgumentException('Invalid visual resource role.'); return $role; }
    private function definition(array $d,string $kind): array {
        $this->guard->validate($d); $allowed=['uri','offlineUri','variants','mime','alt','decorative','posterRole','autoplay','loop','muted','controls','sha256','bytes','offlineCritical','fetchedAt','maxAgeSeconds'];
        foreach(array_keys($d) as $key) if(!in_array($key,$allowed,true)) throw new \InvalidArgumentException("Unsupported {$kind} resource key: {$key}");
        foreach(['uri','offlineUri'] as $k) if(isset($d[$k]) && !$this->safeUri((string)$d[$k])) throw new \InvalidArgumentException('Unsafe visual resource URI.');
        if(isset($d['variants'])) foreach($d['variants'] as $v) { if(!is_array($v)||!isset($v['uri'])||!$this->safeUri((string)$v['uri'])) throw new \InvalidArgumentException('Unsafe visual resource variant.'); }
        if(isset($d['sha256']) && !preg_match('/^[a-f0-9]{64}$/i',(string)$d['sha256'])) throw new \InvalidArgumentException('Invalid visual resource SHA-256.');
        if(isset($d['bytes']) && (!is_int($d['bytes']) || $d['bytes'] < 0)) throw new \InvalidArgumentException('Invalid visual resource byte size.');
        if(isset($d['fetchedAt']) && (!is_int($d['fetchedAt']) || $d['fetchedAt'] < 0)) throw new \InvalidArgumentException('Invalid fetchedAt.');
        if(isset($d['maxAgeSeconds']) && (!is_int($d['maxAgeSeconds']) || $d['maxAgeSeconds'] < 0 || $d['maxAgeSeconds'] > 604800)) throw new \InvalidArgumentException('Invalid maxAgeSeconds.');
        if($kind==='media' && !empty($d['autoplay']) && empty($d['muted'])) throw new \InvalidArgumentException('Autoplay media must be muted.');
        return $d;
    }
    private function safeUri(string $uri): bool { $lower=strtolower(trim($uri)); if($lower==='' || preg_match('/[\x00-\x20<>"`]/',$uri)) return false; return str_starts_with($uri,'/') || str_starts_with($lower,'https://') || str_starts_with($lower,'asset://') || str_starts_with($lower,'titan://'); }
    private function resolveFrom(array $store,string $role,VisualEnvironment $e,array $context): ?array {
        $role=$this->role($role); if(!isset($store[$role])) return null; $d=$store[$role];
        $chosen=$d['uri']??null; $reason='default';
        if(in_array($e->connectivity,['offline','none'],true) && !empty($d['offlineUri'])) { $chosen=$d['offlineUri']; $reason='offline'; }
        elseif(!empty($d['variants'])) { $best=null; foreach($d['variants'] as $v){ $min=(float)($v['minDpr']??1); $max=(float)($v['maxDpr']??99); $device=$v['deviceClass']??null; if($e->devicePixelRatio >= $min && $e->devicePixelRatio <= $max && ($device===null||$device===$e->deviceClass)) { $best=$v; } } if($best){$chosen=$best['uri'];$reason='variant';} }
        if(!$chosen) return null; return ['role'=>$role,'uri'=>$chosen,'mime'=>$d['mime']??null,'alt'=>$d['alt']??null,'decorative'=>(bool)($d['decorative']??false),'resolution'=>$reason,'context'=>$context,'business_meaning_unchanged'=>true];
    }
    public function resolveIcon(string $role,VisualEnvironment $e,array $context=[]): ?array { return $this->resolveFrom($this->icons,$role,$e,$context); }
    public function resolveMedia(string $role,VisualEnvironment $e,array $context=[]): ?array { return $this->resolveFrom($this->media,$role,$e,$context); }
}

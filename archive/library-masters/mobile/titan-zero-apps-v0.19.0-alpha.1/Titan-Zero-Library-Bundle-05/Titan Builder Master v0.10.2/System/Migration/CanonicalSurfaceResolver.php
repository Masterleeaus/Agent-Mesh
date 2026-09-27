<?php
namespace App\Extensions\TitanBuilder\System\Migration;

final class CanonicalSurfaceResolver
{
    private const ALIASES = [
        'zero'=>'zero','base'=>'zero','owner'=>'zero','command'=>'zero','bos'=>'zero','business'=>'zero','manager'=>'zero',
        'go'=>'go','field'=>'go','worker'=>'go',
        'hub'=>'hub','customer'=>'hub',
    ];

    public function resolve(string $surface, ?string $journey = null): array
    {
        $key = strtolower(trim($surface));
        if ($key === 'onboarding') return ['surface'=>'zero','journey'=>'onboarding','legacy'=>true];
        if (!isset(self::ALIASES[$key])) throw new \InvalidArgumentException('Unsupported Titan app surface: '.$surface);
        $canonical=self::ALIASES[$key];
        return ['surface'=>$canonical,'journey'=>$journey,'legacy'=>$canonical !== $key];
    }

    public function canonicalSurfaces(): array { return ['zero','go','hub']; }
    public function aliases(): array { return self::ALIASES; }
}

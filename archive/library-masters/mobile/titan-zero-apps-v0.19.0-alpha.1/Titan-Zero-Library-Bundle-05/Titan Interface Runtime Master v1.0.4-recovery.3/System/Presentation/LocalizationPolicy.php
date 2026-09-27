<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Presentation;

final readonly class LocalizationPolicy
{
    /** @param list<string> $supported */
    public function __construct(private array $supported=['en'],private string $fallback='en')
    {
        if($supported===[]||!in_array($fallback,$supported,true))throw new \InvalidArgumentException('Localization policy requires a supported fallback locale.');
        foreach($supported as$l)$this->assertLocale($l);
    }
    public function resolve(string $requested): LocalizationProfile
    {
        $this->assertLocale($requested);$locale=in_array($requested,$this->supported,true)?$requested:$this->fallback;
        $base=strtolower(explode('-',$locale)[0]);$rtl=in_array($base,['ar','fa','he','ur'],true);
        return new LocalizationProfile($locale,$this->fallback,$rtl?'rtl':'ltr');
    }
    private function assertLocale(string $locale):void{if(!preg_match('/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/',$locale))throw new \InvalidArgumentException('Locale is invalid.');}
}

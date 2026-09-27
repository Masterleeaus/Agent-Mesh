<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Navigation;

use Illuminate\Contracts\Container\Container;
use ReflectionMethod;
use Throwable;

final class HostNavigationRegistrar
{
    public function __construct(private readonly Container $container, private readonly TitanMcpNavigation $navigation) {}

    public function register(): void
    {
        foreach ([
            ['App\\Support\\Extensions\\MenuContributionRegistry','navigation.admin'],
            ['App\\Support\\Extensions\\ContributionRegistry','navigation.admin'],
        ] as [$class,$channel]) {
            if (!class_exists($class)) continue;
            try {
                $registry=$this->container->make($class);
                foreach (['register','contribute','add'] as $method) {
                    if (!method_exists($registry,$method)) continue;
                    $this->invoke($registry,$method,$channel,$this->navigation->admin());
                    break;
                }
            } catch (Throwable) { /* optional host bridge */ }
        }
    }

    /** @param array<int,array<string,mixed>> $items */
    private function invoke(object $registry,string $method,string $channel,array $items): void
    {
        $r=new ReflectionMethod($registry,$method); $params=$r->getParameters(); $count=count($params);
        if($count<=1){$registry->{$method}($items);return;}
        if($count===2){$first=strtolower($params[0]->getName()); if(str_contains($first,'channel')||str_contains($first,'surface')||str_contains($first,'type')){$registry->{$method}($channel,$items);}else{$registry->{$method}('titan-mcp',$items);}return;}
        $registry->{$method}($channel,'titan-mcp',$items);
    }
}

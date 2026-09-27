<?php
declare(strict_types=1);
namespace App\Extensions\TitanInterfaceRuntime\System\Catalogue;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\BuilderCatalogue;
use Illuminate\Contracts\Container\Container;

final class InstalledBuilderCatalogue implements BuilderCatalogue
{
    public function __construct(private readonly Container $app, private readonly FallbackBuilderCatalogue $fallback) {}
    public function has(string $component): bool
    {
        $registry='App\\Extensions\\TitanBuilder\\System\\Contracts\\ComponentRegistry';
        if(interface_exists($registry)&&$this->app->bound($registry)){
            $found=$this->app->make($registry)->find($component);
            if(is_array($found)) return true;
        }
        return $this->fallback->has($component);
    }
    public function definition(string $component): ?array
    {
        $registry='App\\Extensions\\TitanBuilder\\System\\Contracts\\ComponentRegistry';
        if(interface_exists($registry)&&$this->app->bound($registry)){
            $found=$this->app->make($registry)->find($component);
            if(is_array($found)) return $found+['source'=>'titan-builder'];
        }
        return $this->fallback->definition($component);
    }
}

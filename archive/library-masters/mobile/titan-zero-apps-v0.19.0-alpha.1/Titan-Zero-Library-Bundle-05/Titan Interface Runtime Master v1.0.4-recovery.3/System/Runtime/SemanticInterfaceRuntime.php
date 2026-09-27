<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Runtime;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\{InterfaceRuntime,BuilderCatalogue,VisualRuntimeBridge,InterfaceContributionRegistry};
use App\Extensions\TitanInterfaceRuntime\System\Registry\SemanticInterfaceContributionRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Security\{GeneratedSpecGuard,ProjectionGuard};
use App\Extensions\TitanInterfaceRuntime\System\Surface\CanonicalSurfaceResolver;
use App\Extensions\TitanInterfaceRuntime\System\Value\{InterfaceContext,PresentationResult};

final class SemanticInterfaceRuntime implements InterfaceRuntime
{
    private CanonicalSurfaceResolver $surfaces;
    private InterfaceContributionRegistry $contributions;

    public function __construct(
        private GeneratedSpecGuard $guard,
        private ProjectionGuard $projections,
        private BuilderCatalogue $catalogue,
        private VisualRuntimeBridge $visual,
        ?CanonicalSurfaceResolver $surfaces=null,
        ?InterfaceContributionRegistry $contributions=null,
    ) {
        $this->surfaces=$surfaces??new CanonicalSurfaceResolver();
        $this->contributions=$contributions??new SemanticInterfaceContributionRegistry();
    }

    public function execute(array $spec,InterfaceContext $context): PresentationResult
    {
        $context=$this->canonicalContext($context);
        $spec=$this->resolveContribution($spec,$context);
        $this->guard->assertSafe($spec);
        $this->projections->assertContext($context);
        $repairs=[];
        $tree=$this->normalise($spec,$repairs);
        $visualHints=is_array($tree['visual']??null)?$tree['visual']:[];
        unset($tree['visual']);
        try {
            $tree=$this->visual->decorate($tree,$visualHints,['surface'=>$context->surface,'device'=>$context->device,'connectivity'=>$context->connectivity]);
            return new PresentationResult($tree,$repairs,false);
        } catch (\Throwable $e) {
            $repairs[]='visual-runtime-fallback';
            $tree['_visual']=['status'=>'degraded','graceful_fallback'=>true];
            return new PresentationResult($tree,$repairs,true);
        }
    }

    private function canonicalContext(InterfaceContext $context): InterfaceContext
    {
        $resolved=$this->surfaces->resolve($context->surface,$context->journey);
        if($resolved->surface===$context->surface && $resolved->journey===$context->journey) return $context;
        return new InterfaceContext(
            $resolved->surface,
            $resolved->journey,
            $context->companyId,
            $context->actorId,
            $context->permissions,
            $context->projection,
            $context->device,
            $context->connectivity,
            $context->presentation,
        );
    }

    private function resolveContribution(array $spec,InterfaceContext $context): array
    {
        $key=$spec['contribution']??null;
        if(!is_string($key)||trim($key)==='') return $spec;
        $contribution=$this->contributions->find($key);
        if($contribution===null) return ['component'=>'titan.notice','props'=>['message'=>'Presentation contribution unavailable','contribution'=>$key]];

        $payload=$contribution->definition();
        $surfaces=$payload['surfaces']??null;
        if(is_array($surfaces) && !in_array($context->surface,$surfaces,true)) {
            throw new \RuntimeException("Interface contribution {$key} is not approved for surface {$context->surface}.");
        }
        if($context->surface==='hub' && array_key_exists('customer_safe',$payload) && $payload['customer_safe']!==true) {
            throw new \RuntimeException("Interface contribution {$key} is not customer-safe.");
        }

        $base=is_array($payload['definition']??null)?$payload['definition']:[];
        unset($spec['contribution']);
        return array_replace_recursive($base,$spec);
    }

    private function normalise(array $node,array &$repairs): array
    {
        $component=(string)($node['component']??'titan.notice');
        if(!$this->catalogue->has($component)){
            $repairs[]='unknown-component:'.$component;
            $component='titan.notice';
            $node['props']=['message'=>'Presentation unavailable','original_component'=>$node['component']??null];
        }
        $out=['component'=>$component,'props'=>is_array($node['props']??null)?$node['props']:[]];
        foreach(['binding','condition','repeat','state','accessibility','visual'] as $k) if(array_key_exists($k,$node)) $out[$k]=$node[$k];
        $out['children']=[];
        foreach(($node['children']??[]) as $child) if(is_array($child)) $out['children'][]=$this->normalise($child,$repairs);
        return $out;
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Command;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Command\CommandSurfaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Inspector\ContextInspectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\DomainRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationNode;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ResponsiveHints;

final readonly class CommandSurface implements CommandSurfaceContract
{
    public function __construct(
        private DomainRegistryContract $domains,
        private ContextInspectorContract $inspector,
        private BuilderPresentationAdapter $presentation,
        private int $defaultLimit=30,
        private int $maxLimit=100,
    ) {
        if ($defaultLimit<1 || $maxLimit<1 || $defaultLimit>$maxLimit) throw new \InvalidArgumentException('command result limits are invalid.');
    }

    public function search(string $query, InterfaceContext $context, ?int $limit=null): CommandSurfaceSnapshot
    {
        $query=$this->normalizeQuery($query);
        $limit=max(1,min($limit ?? $this->defaultLimit,$this->maxLimit));
        $items=[];

        $askLabel=$query==='' ? 'Ask Zero' : "Ask Zero: {$query}";
        $items[]=new CommandItem('ask-zero','ask',$askLabel,'Ask Titan Zero in the current interface context.',[
            'kind'=>'ask','query'=>$query,'domain'=>$context->domain,'object_ref'=>$context->objectRef,'conversation_id'=>$context->conversationId,
        ],$query===''?500:1000,false);

        foreach ($this->domains->visibleFor($context->productSurface) as $domain) {
            foreach ($domain->intentSurfaces as $intent) {
                $label=$domain->label.' · '.ucfirst($intent);
                $score=$this->matchScore($query,$label.' '.$domain->key.' '.$intent,400);
                if ($query!=='' && $score===0) continue;
                $items[]=new CommandItem('navigate:'.$domain->key.':'.$intent,'navigate',$label,'Open this domain intent surface.',[
                    'kind'=>'navigate','domain'=>$domain->key,'intent_surface'=>$intent,'product_surface'=>$context->productSurface,
                ],$score,false);
            }
        }

        if ($context->objectRef!==null) {
            try {
                $ref=ObjectReference::parse($context->objectRef);
                $snapshot=$this->inspector->inspect($ref,$context);
                $objectLabel=$snapshot->object->object->label;
                foreach ([
                    ['inspect','Inspect '.$objectLabel,800],
                    ['workspace','Open '.$objectLabel.' workspace',780],
                ] as [$kind,$label,$base]) {
                    $score=$this->matchScore($query,$label.' '.$context->objectRef,(int)$base);
                    if ($query==='' || $score>0) $items[]=new CommandItem($kind.':'.$context->objectRef,$kind,$label,$kind==='inspect'?'Open the contextual inspector without route navigation.':'Escalate to the full object workspace while preserving context.',[
                        'kind'=>$kind,'object_ref'=>$context->objectRef,'domain'=>$snapshot->context->domain,
                    ],$score,false);
                }
                foreach ($snapshot->actions as $action) {
                    $score=$this->matchScore($query,$action->label.' '.$action->actionKey,700);
                    if ($query!=='' && $score===0) continue;
                    $items[]=new CommandItem('action:'.$action->actionKey,'action',$action->label,'Declared object action; execution remains with its authoritative capability or Interaction Engine interaction.',$action->intent,$score,false);
                }
            } catch (\Throwable) {
                // A stale/invalid object context must not make the global command surface unavailable.
            }
        }

        usort($items,static fn(CommandItem $a,CommandItem $b):int=>[-$a->score,$a->kind,strtolower($a->label),$a->key]<=>[-$b->score,$b->kind,strtolower($b->label),$b->key]);
        $total=count($items); $truncated=$total>$limit; $items=array_slice($items,0,$limit);
        $component=$this->presentation->resolve('command-palette','panel',ResponsiveHints::required());
        $tree=new PresentationTree($context->productSurface,new PresentationNode('component','command-surface',[
            'component'=>$component->jsonSerialize(),'query'=>$query,'result_count'=>count($items),'total'=>$total,'truncated'=>$truncated,'execution'=>'delegated-only',
        ]),ResponsiveHints::required(),['authority'=>'presentation-only','search_scope'=>'registry-and-current-context']);
        return new CommandSurfaceSnapshot($query,array_values($items),$total,$limit,$truncated,$tree);
    }

    private function normalizeQuery(string $query): string
    {
        $query=trim(preg_replace('/\s+/u',' ',$query) ?? '');
        if (strlen($query)>200) throw new \InvalidArgumentException('command query exceeds the 200 character limit.');
        if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/',$query)===1) throw new \InvalidArgumentException('command query contains control characters.');
        return $query;
    }

    private function matchScore(string $query,string $haystack,int $base): int
    {
        if ($query==='') return $base;
        $q=strtolower($query); $h=strtolower($haystack);
        if ($q===$h) return min(10000,$base+300);
        if (str_starts_with($h,$q)) return min(10000,$base+200);
        if (str_contains($h,$q)) return min(10000,$base+100);
        $tokens=array_values(array_filter(explode(' ',$q),static fn(string $v):bool=>$v!==''));
        if ($tokens!==[] && count(array_filter($tokens,static fn(string $token):bool=>str_contains($h,$token)))===count($tokens)) return $base+50;
        return 0;
    }
}

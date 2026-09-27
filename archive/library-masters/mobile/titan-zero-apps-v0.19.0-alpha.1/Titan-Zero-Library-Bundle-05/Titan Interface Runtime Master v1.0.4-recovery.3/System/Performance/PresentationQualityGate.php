<?php

declare(strict_types=1);
namespace App\Extensions\TitanInterfaceRuntime\System\Performance;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\AccessibilityAuditor;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\LocalizationPolicy;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ResponsiveAuditor;
final readonly class PresentationQualityGate
{
    public function __construct(private PresentationCache $cache,private AccessibilityAuditor $accessibility,private ResponsiveAuditor $responsive,private LocalizationPolicy $localization,private PresentationPerformanceGuard $performance){}
    /** @param list<float|int> $latencySamplesMs */
    public function assess(InterfaceContext $context,string $locale,string $fingerprint,PresentationTree $tree,array $latencySamplesMs=[]):PresentationQualityEnvelope
    {
        $profile=$this->localization->resolve($locale);$cached=$this->cache->get($context,$profile->locale,$fingerprint);$cacheHit=$cached!==null;$candidate=$cached??$tree;
        $a=$this->accessibility->audit($candidate);$r=$this->responsive->audit($candidate);$p=$this->performance->inspect($candidate,$latencySamplesMs);
        $envelope=new PresentationQualityEnvelope($candidate,$profile,$a,$r,$p,$cacheHit);if($envelope->passes()&&!$cacheHit)$this->cache->put($context,$profile->locale,$fingerprint,$candidate);return $envelope;
    }
}

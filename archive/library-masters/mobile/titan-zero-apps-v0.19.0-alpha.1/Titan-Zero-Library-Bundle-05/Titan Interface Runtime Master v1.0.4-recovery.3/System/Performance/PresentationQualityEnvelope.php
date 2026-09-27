<?php

declare(strict_types=1);
namespace App\Extensions\TitanInterfaceRuntime\System\Performance;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\AccessibilityAuditReport;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\LocalizationProfile;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ResponsiveAuditReport;
final readonly class PresentationQualityEnvelope implements \JsonSerializable
{
    public function __construct(public PresentationTree $tree,public LocalizationProfile $localization,public AccessibilityAuditReport $accessibility,public ResponsiveAuditReport $responsive,public PresentationPerformanceReport $performance,public bool $cacheHit){}
    public function passes():bool{return $this->accessibility->passesWcag22AaTarget()&&$this->responsive->passes()&&$this->performance->withinBudget();}
    public function jsonSerialize():array{return ['passes'=>$this->passes(),'cache_hit'=>$this->cacheHit,'localization'=>$this->localization->jsonSerialize(),'accessibility'=>$this->accessibility->jsonSerialize(),'responsive'=>$this->responsive->jsonSerialize(),'performance'=>$this->performance->jsonSerialize(),'tree'=>$this->tree->jsonSerialize()];}
}

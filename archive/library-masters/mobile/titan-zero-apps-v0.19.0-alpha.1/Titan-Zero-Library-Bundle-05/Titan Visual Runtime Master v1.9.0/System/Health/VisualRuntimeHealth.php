<?php
declare(strict_types=1); namespace App\Extensions\TitanVisualRuntime\System\Health;
use App\Extensions\TitanVisualRuntime\System\Contracts\{VisualCapabilityRegistry,VisualContributionRegistry,VisualResourceRegistry};
final class VisualRuntimeHealth {
 public function __construct(private readonly VisualCapabilityRegistry $caps,private readonly VisualContributionRegistry $contribs,private readonly VisualResourceRegistry $resources){}
 public function check(): array { $i=$this->resources->inventory(); return ['status'=>'ok','surfaces'=>['zero','go','hub'],'capabilities'=>count($this->caps->all()),'contributions'=>count($this->contribs->all()),'resources'=>['assets'=>count($i['assets']),'icons'=>count($i['icons']),'media'=>count($i['media'])],'arbitrary_code'=>false,'platform_accessible'=>true]; }
}

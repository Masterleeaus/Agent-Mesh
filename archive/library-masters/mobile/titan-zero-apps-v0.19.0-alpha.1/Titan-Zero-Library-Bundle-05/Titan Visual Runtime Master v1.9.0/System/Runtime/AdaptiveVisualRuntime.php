<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Runtime;
use App\Extensions\TitanVisualRuntime\System\Contracts\{VisualRuntime,VisualEnvironment,VisualPreferences,VisualCapabilityNegotiator,VisualContributionRegistry,VisualFallbackPlanner,InterfaceRuntimeBridgeCompatibility};
final class AdaptiveVisualRuntime implements VisualRuntime {
 public function __construct(private readonly VisualCapabilityNegotiator $negotiator,private readonly VisualContributionRegistry $contribs,private readonly VisualFallbackPlanner $fallbacks,private readonly VisualMetadataGuard $guard,private readonly ?InterfaceRuntimeBridgeCompatibility $bridgeCompatibility=null){}
 public function plan(array $r,VisualEnvironment $e,VisualPreferences $p): array {
  if($this->bridgeCompatibility!==null) $r=$this->bridgeCompatibility->normalizeRequest($r);
  $this->guard->validate($r); $surface=$e->surface; if(!in_array($surface,['zero','go','hub'],true)) throw new \InvalidArgumentException('Unsupported surface');
  $negotiation=$this->negotiator->negotiate($r['visualCapabilityRequirements']??[],$e);
  $motion=$p->reducedMotion?'none':($r['motionPreset']??'standard'); if($e->lowPower && $motion!=='none') $motion='reduced';
  $transition=$p->reducedMotion?'none':($r['transitionPreset']??'crossfade'); if($e->lowPower && $transition!=='none') $transition='crossfade';
  $fallback=$this->fallbacks->fallback($r,$e,$p,$negotiation);
  return ['surface'=>$surface,'visualTreatment'=>$r['visualTreatment']??'default','motionPreset'=>$motion,'transitionPreset'=>$transition,'density'=>$this->density($e,$r),'contrast'=>$p->highContrast?'high':($r['contrastRules']['default']??'normal'),'capabilities'=>$negotiation,'strategy'=>$fallback['degraded']?'fallback':$negotiation['strategy'],'fallback'=>$fallback,'semantics_passthrough'=>true,'business_meaning_unchanged'=>true,'authorizes_actions'=>false,'tenant_boundary'=>'company_id','company_id'=>$e->companyId,'company_scope_inferred'=>false,'interface_bridge_profile'=>$this->bridgeCompatibility?->profile()];
 }
 private function density(VisualEnvironment $e,array $r): string { if(isset($r['densityRules'][$e->deviceClass])) return (string)$r['densityRules'][$e->deviceClass]; return $e->width>0&&$e->width<600?'compact':'comfortable'; }
}

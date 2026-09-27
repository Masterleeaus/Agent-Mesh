<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Runtime;
use App\Extensions\TitanVisualRuntime\System\Contracts\{VisualCapabilityRegistry,VisualEnvironment};
final class DefaultVisualCapabilityRegistry implements VisualCapabilityRegistry {
 public function all(): array { return ['motion','transitions','svg','images','canvas','webgl','rich-charts','camera-overlay','audio-visualisation','video','spatial-3d','high-dpi','offline-assets']; }
 public function supports(string $c,VisualEnvironment $e): bool { return match($c){'webgl','spatial-3d'=>$e->webgl&&!$e->lowPower,'canvas'=>$e->canvas,'video'=>$e->connectivity!=='offline','high-dpi'=>$e->devicePixelRatio>=1.5,default=>in_array($c,$this->all(),true)}; }
}

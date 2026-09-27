<?php
require_once __DIR__.'/../../System/Contracts/VisualContractEvolutionPolicy.php';
require_once __DIR__.'/../../System/Visual/BuilderVisualMetadata.php';

use App\Extensions\TitanBuilder\System\Contracts\VisualContractEvolutionPolicy;
use App\Extensions\TitanBuilder\System\Visual\BuilderVisualMetadata;

if(!VisualContractEvolutionPolicy::canRead('1.0')) throw new RuntimeException('1.0 should remain readable');
if(!VisualContractEvolutionPolicy::canRead('1.1')) throw new RuntimeException('1.1 should be readable');
if(VisualContractEvolutionPolicy::canRead('2.0')) throw new RuntimeException('2.0 should fail closed');

$m=(new BuilderVisualMetadata())->normalise([
    'visualTreatment'=>'card',
    'visualPriority'=>50,
    'capabilityFallbackOrder'=>['webgl','canvas','static'],
    'resourcePolicy'=>['cacheMode'=>'prefer-offline','maxAgeSeconds'=>3600,'integrityRequired'=>true],
]);

if(($m['visualPriority']??null)!==50) throw new RuntimeException('visualPriority missing');
if(($m['resourcePolicy']['integrityRequired']??null)!==true) throw new RuntimeException('resourcePolicy missing');

echo "BUILDER_VISUAL_UPGRADE_CONTRACT: PASS\n";

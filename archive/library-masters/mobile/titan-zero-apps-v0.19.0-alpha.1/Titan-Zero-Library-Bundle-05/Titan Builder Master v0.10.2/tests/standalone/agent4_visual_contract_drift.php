<?php
require_once __DIR__.'/../../System/Contracts/VisualRuntimeContractFingerprint.php';
use App\Extensions\TitanBuilder\System\Contracts\VisualRuntimeContractFingerprint;
$path=__DIR__.'/../../resources/builder/schemas/visual-metadata.schema.json';
VisualRuntimeContractFingerprint::assertSchema(file_get_contents($path));
try{VisualRuntimeContractFingerprint::assertSchema(file_get_contents($path).' '); throw new RuntimeException('drift accepted');}
catch(RuntimeException $e){if($e->getMessage()==='drift accepted')throw $e;}
echo "BUILDER_VISUAL_CONTRACT_DRIFT: PASS\n";

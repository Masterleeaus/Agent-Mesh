<?php
require_once __DIR__.'/../../System/Contracts/VisualRuntimeMetadataContract.php';
use App\Extensions\TitanBuilder\System\Contracts\VisualRuntimeMetadataContract;

if(VisualRuntimeMetadataContract::VERSION!=='1.1') throw new RuntimeException('bad contract version');
VisualRuntimeMetadataContract::assertCompatible('1.7.0');
VisualRuntimeMetadataContract::assertCompatible('1.99.0');

try{
    VisualRuntimeMetadataContract::assertCompatible('2.0.0');
    throw new RuntimeException('major mismatch accepted');
}catch(RuntimeException $e){
    if($e->getMessage()==='major mismatch accepted') throw $e;
}

echo "BUILDER_VISUAL_RUNTIME_CONTRACT: PASS\n";

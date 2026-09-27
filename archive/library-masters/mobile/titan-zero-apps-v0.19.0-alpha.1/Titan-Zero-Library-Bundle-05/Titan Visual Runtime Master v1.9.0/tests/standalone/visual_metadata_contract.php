<?php
require_once __DIR__.'/../../System/Contracts/VisualMetadataContract.php';
require_once __DIR__.'/../../System/Runtime/DefaultVisualMetadataContract.php';
use App\Extensions\TitanVisualRuntime\System\Runtime\DefaultVisualMetadataContract;

$c=new DefaultVisualMetadataContract();
if($c->version()!=='1.1') throw new RuntimeException('bad version');

$c->assertProducerCompatible('1.0');
$c->assertProducerCompatible('1.1');

try{
    $c->assertProducerCompatible('2.0');
    throw new RuntimeException('bad major accepted');
}catch(RuntimeException $e){
    if($e->getMessage()==='bad major accepted') throw $e;
}

echo "VISUAL_METADATA_CONTRACT: PASS\n";

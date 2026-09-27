<?php
require_once __DIR__.'/../../System/Contracts/VisualMetadataContract.php';
require_once __DIR__.'/../../System/Runtime/DefaultVisualMetadataContract.php';
use App\Extensions\TitanVisualRuntime\System\Runtime\DefaultVisualMetadataContract;

$c=new DefaultVisualMetadataContract();
$c->assertSchemaFingerprint('38f0752dedb7578fde0eda36e7b145879a4fb8a27049664faecdd0b1afa10745');

try{
    $c->assertSchemaFingerprint(str_repeat('0',64));
    throw new RuntimeException('bad fingerprint accepted');
}catch(RuntimeException $e){
    if($e->getMessage()==='bad fingerprint accepted') throw $e;
}

echo "VISUAL_CONTRACT_FINGERPRINT: PASS\n";

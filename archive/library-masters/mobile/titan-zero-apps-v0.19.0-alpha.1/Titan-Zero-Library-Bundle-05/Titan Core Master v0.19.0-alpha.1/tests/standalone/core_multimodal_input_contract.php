<?php
$root=realpath(__DIR__.'/../..');
foreach(['System/Support/AppMultimodalInput.php','System/Services/AppMultimodalInputNormalizer.php','System/Support/AppWorkspaceCheckpoint.php'] as $rel) assert(is_file($root.'/'.$rel));
require_once $root.'/System/Support/AppMultimodalInput.php';
require_once $root.'/System/Services/AppMultimodalInputNormalizer.php';
require_once $root.'/System/Support/AppWorkspaceCheckpoint.php';
use App\Extensions\TitanAppsCore\System\Services\AppMultimodalInputNormalizer;
use App\Extensions\TitanAppsCore\System\Support\AppWorkspaceCheckpoint;
$n=new AppMultimodalInputNormalizer();
$i=$n->normalize(['mode'=>'voice','text'=>'  book a clean ','media_refs'=>['asset:1']],['text','voice','vision','touch','attachment']);
assert($i->mode==='voice'); assert($i->text==='book a clean'); assert($i->mediaRefs===['asset:1']);
try{$n->normalize(['mode'=>'camera'],['text','voice']);assert(false);}catch(InvalidArgumentException $e){assert($e->getMessage()==='app_input_mode_not_allowed');}
$c=new AppWorkspaceCheckpoint('work','presenting',4,['intent'=>'show jobs']); assert($c->revision===4); assert($c->toArray()['section']==='work');
echo "core_multimodal_input_contract: ok\n";

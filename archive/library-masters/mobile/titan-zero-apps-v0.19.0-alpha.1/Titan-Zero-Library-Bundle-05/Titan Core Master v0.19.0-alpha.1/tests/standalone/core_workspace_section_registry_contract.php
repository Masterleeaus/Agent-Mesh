<?php
$root=realpath(__DIR__.'/../..');
require_once $root.'/System/Contracts/AppSurface.php';
require_once $root.'/System/Services/AppWorkspaceSectionRegistry.php';
use App\Extensions\TitanAppsCore\System\Services\AppWorkspaceSectionRegistry;

$r=new AppWorkspaceSectionRegistry([
 'zero'=>[
   ['id'=>'zero','label'=>'Zero','modules'=>['zero','dashboard']],
   ['id'=>'work','label'=>'Work','modules'=>['jobs','workforce']],
   ['id'=>'inbox','label'=>'Inbox','modules'=>['inbox']],
   ['id'=>'more','label'=>'More','modules'=>[]],
 ],
]);
assert($r->ids('zero')===['zero','work','inbox','more']);
assert($r->get('zero','work')['modules']===['jobs','workforce']);
assert($r->default('zero')['id']==='zero');
echo "core_workspace_section_registry_contract: ok\n";

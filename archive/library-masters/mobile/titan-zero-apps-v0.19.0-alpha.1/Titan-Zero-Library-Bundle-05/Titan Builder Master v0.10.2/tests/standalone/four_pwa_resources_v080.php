<?php

declare(strict_types=1);
$root = dirname(__DIR__, 2);
$read=static fn(string $p):array=>json_decode((string)file_get_contents($p),true,512,JSON_THROW_ON_ERROR);
$products=['customer'=>'Titan Hub','field'=>'Titan Go','owner'=>'Titan Command','onboarding'=>'Titan Onboarding'];
foreach($products as $surface=>$product){
    $s=$read($root.'/resources/builder/surfaces/'.$surface.'.json');
    $t=$read($root.'/resources/builder/templates/'.$surface.'.json');
    if(($s['product']??null)!==$product||($t['identity']['product']??null)!==$product){throw new RuntimeException("{$surface} product identity mismatch");}
    if(($s['authority']??null)!=='presentation-only'){throw new RuntimeException("{$surface} authority regression");}
}
$onboarding=$read($root.'/resources/builder/specs/titan-onboarding.json');
require_once $root.'/System/Contracts/ActionCatalog.php';
require_once $root.'/System/Contracts/DataSourceCatalog.php';
require_once $root.'/System/GenerativeUI/BuilderRegistry.php';
require_once $root.'/System/Migration/LegacyBusinessSpecMigrator.php';
require_once $root.'/System/Registries/ManifestActionCatalog.php';
require_once $root.'/System/Registries/JsonDataSourceCatalog.php';
require_once $root.'/System/GenerativeUI/GenerativeUiSpecNormaliser.php';
require_once $root.'/System/GenerativeUI/GenerativeUiSpecValidator.php';
$registry=new App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry($root.'/resources/builder');
$actions=new App\Extensions\TitanBuilder\System\Registries\ManifestActionCatalog($registry);
$sources=new App\Extensions\TitanBuilder\System\Registries\JsonDataSourceCatalog($registry);
$normaliser=new App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecNormaliser($registry,$actions,new App\Extensions\TitanBuilder\System\Migration\LegacyBusinessSpecMigrator());
$validator=new App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecValidator($registry,$normaliser,$actions,$sources);
if(!$validator->isValid($onboarding)){throw new RuntimeException('Onboarding spec does not validate.');}
if(count($registry->componentIds())!==125){throw new RuntimeException('v0.7 component count was not preserved.');}
if(count($registry->all('blocks'))!==26){throw new RuntimeException('v0.7 block count was not preserved.');}
if(count($registry->all('templates'))<11||count($registry->all('pages'))<30||count($registry->all('specs'))<26){throw new RuntimeException('Four-PWA resources were not added additively.');}
echo "Four-PWA resources PASS\n";

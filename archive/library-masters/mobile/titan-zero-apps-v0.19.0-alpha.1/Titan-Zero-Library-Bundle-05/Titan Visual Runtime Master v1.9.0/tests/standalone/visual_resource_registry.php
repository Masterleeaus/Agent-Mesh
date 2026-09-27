<?php
declare(strict_types=1);
$base=dirname(__DIR__,2);
require $base.'/System/Contracts/VisualEnvironment.php';
require $base.'/System/Contracts/VisualResourceRegistry.php';
require $base.'/System/Runtime/VisualMetadataGuard.php';
require $base.'/System/Runtime/InMemoryVisualResourceRegistry.php';
use App\Extensions\TitanVisualRuntime\System\Contracts\VisualEnvironment;
use App\Extensions\TitanVisualRuntime\System\Runtime\{VisualMetadataGuard,InMemoryVisualResourceRegistry};
$r=new InMemoryVisualResourceRegistry(new VisualMetadataGuard());
$r->registerAsset('brand.hero',['uri'=>'/img/hero.png','offlineUri'=>'/offline/hero.png','variants'=>[['uri'=>'/img/hero@2x.png','minDpr'=>2]],'alt'=>'Hero']);
$online=$r->resolveAsset('brand.hero',new VisualEnvironment('zero','tablet',1024,2.0,false,true,false,'online'));
if(($online['uri']??'')!=='/img/hero@2x.png') {fwrite(STDERR,"DPR resolution failed\n");exit(1);} 
$offline=$r->resolveAsset('brand.hero',new VisualEnvironment('zero','tablet',1024,2.0,false,true,false,'offline'));
if(($offline['uri']??'')!=='/offline/hero.png') {fwrite(STDERR,"offline resolution failed\n");exit(2);} 
$blocked=false; try{$r->registerMedia('bad.video',['uri'=>'javascript:alert(1)']);}catch(InvalidArgumentException){$blocked=true;} if(!$blocked) exit(3);
$blocked=false; try{$r->registerMedia('bad.autoplay',['uri'=>'/video/a.mp4','autoplay'=>true,'muted'=>false]);}catch(InvalidArgumentException){$blocked=true;} if(!$blocked) exit(4);
echo "VISUAL_RESOURCE_REGISTRY: PASS\n";

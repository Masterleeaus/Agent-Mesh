<?php
require_once __DIR__.'/../../System/Contracts/VisualResourceIntegrityVerifier.php';
require_once __DIR__.'/../../System/Contracts/VisualOfflineCachePlanner.php';
require_once __DIR__.'/../../System/Contracts/VisualEnvironment.php';
require_once __DIR__.'/../../System/Runtime/Sha256VisualResourceIntegrityVerifier.php';
require_once __DIR__.'/../../System/Runtime/DeterministicVisualOfflineCachePlanner.php';
use App\Extensions\TitanVisualRuntime\System\Runtime\{Sha256VisualResourceIntegrityVerifier,DeterministicVisualOfflineCachePlanner};
use App\Extensions\TitanVisualRuntime\System\Contracts\VisualEnvironment;
$v=new Sha256VisualResourceIntegrityVerifier(); $bytes='titan'; $sha=hash('sha256',$bytes);
if(!$v->verify(['sha256'=>$sha],$bytes)['verified']) throw new RuntimeException('integrity match failed');
if($v->verify(['sha256'=>$sha],'tampered')['verified']) throw new RuntimeException('tamper accepted');
$e=new VisualEnvironment(surface:'zero',deviceClass:'desktop',width:1024,devicePixelRatio:2.0,webgl:true,canvas:true,lowPower:false,connectivity:'offline',memoryMb:4096,gpuTier:'normal');
$p=new DeterministicVisualOfflineCachePlanner();
$plan=$p->plan([
 ['role'=>'shell.logo','uri'=>'/logo.svg','offlineCritical'=>true,'bytes'=>100,'sha256'=>$sha],
 ['role'=>'hero.video','uri'=>'/hero.mp4','bytes'=>500]
],$e);
if(count($plan['resources'])!==2 || $plan['estimatedBytes']!==600) throw new RuntimeException('offline cache plan failed');
echo "VISUAL_INTEGRITY_OFFLINE: PASS\n";

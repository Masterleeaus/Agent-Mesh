<?php
$root=dirname(__DIR__);
$m=json_decode(file_get_contents($root.'/extension.manifest.json'),true,512,JSON_THROW_ON_ERROR);
$c=json_decode(file_get_contents($root.'/resources/contracts/titan-apps-interface-runtime.v1.json'),true,512,JSON_THROW_ON_ERROR);
function nmt(bool $x,string $m):void{if(!$x){fwrite(STDERR,"FAIL $m\n");exit(1);}echo "PASS $m\n";}
nmt(($m['schema_version']??null)==='2.2','native manifest schema');
nmt(($m['key']??null)==='titan-interface-runtime','native manifest key');
nmt(($m['data']['tenant_key']??null)==='company_id','company_id sole manifest tenant key');
nmt(($c['canonical_surfaces']??[])===['zero','go','hub'],'canonical zero/go/hub surfaces');
nmt(($c['journeys']['onboarding']['surface']??null)==='zero','onboarding remains zero journey');
nmt(($c['canonical_company_boundary']??null)==='company_id','convergence contract company boundary');
nmt(is_file($root.'/System/TitanInterfaceRuntimeServiceProvider.php'),'provider target exists');

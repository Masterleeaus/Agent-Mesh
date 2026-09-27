<?php
$root=dirname(__DIR__); $m=json_decode(file_get_contents($root.'/extension.manifest.json'),true,512,JSON_THROW_ON_ERROR);
function nmt(bool $x,string $m):void{if(!$x){fwrite(STDERR,"FAIL $m\n");exit(1);}echo "PASS $m\n";}
nmt(($m['schema_version']??null)==='2.2','native manifest schema');
nmt(($m['slug']??null)==='titan-hub','native slug');
nmt(($m['data']['tenant_key']??null)==='company_id','company_id sole manifest tenant key');
nmt(($m['surface']['canonical']??null)==='hub','hub canonical surface');
nmt(($m['surface']['aliases']['customer']??null)==='hub','customer compatibility alias');
nmt(is_file($root.'/System/TitanHubServiceProvider.php'),'provider target exists');

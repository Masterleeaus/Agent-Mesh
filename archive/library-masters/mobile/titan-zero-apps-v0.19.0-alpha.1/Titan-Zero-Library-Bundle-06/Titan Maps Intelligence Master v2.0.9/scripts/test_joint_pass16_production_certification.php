<?php
declare(strict_types=1);
$root=dirname(__DIR__); $n=0; $fail=[]; $ok=function(bool $v,string $m)use(&$n,&$fail){$n++;if(!$v)$fail[]=$m;};
$ok(!is_file($root.'/System/Integrations/WorkCoreMapsIntegrationService.php'),'dead WorkCore integration service removed');
$manifest=json_decode(file_get_contents($root.'/extension.manifest.json'),true); $keys=array_map(fn($x)=>$x['key']??'', $manifest['dependencies']['optional']??[]); $ok(!in_array('workcore',$keys,true),'obsolete WorkCore engine dependency removed');
$eco=json_decode(file_get_contents($root.'/ecosystem-integration.json'),true); $ok(($eco['execution']['target_domain_owns_mutation']??false)===true,'production boundary declared through canonical ecosystem target-domain ownership');
$ref=file_get_contents($root.'/Contracts/FieldReferenceGateway.php'); $ok(!str_contains($ref,'operational WorkCore reference'),'Field reference contract is ownership-neutral');
$job=file_get_contents($root.'/Services/JobTravelContextService.php'); $ok(str_contains($job,'Titan Field when active'),'travel context declares Field-preferred authority');
$provider=file_get_contents($root.'/System/TitanMapsIntelligenceServiceProvider.php'); $ok(str_contains($provider,'TitanFieldReferenceGateway'),'Field preferred reference adapter retained'); $ok(str_contains($provider,'WorkCoreFieldReferenceGateway'),'legacy standalone fallback retained');
$ok(is_file($root.'/docs/PASS16_PRODUCTION_CERTIFICATION.md'),'production certification report present');
foreach(glob($root.'/database/migrations/*.php') as $p){$s=file_get_contents($p); if(preg_match('/public function up\(\): void\s*\{([\s\S]*?)public function down/',$s,$mm))$ok(!preg_match('/Schema::drop|dropColumn|dropIfExists/',$mm[1]),'no destructive up migration '.basename($p));}
if($fail){foreach($fail as $x)fwrite(STDERR,"FAIL $x\n"); exit(1);} echo "PASS: $n assertions\n";

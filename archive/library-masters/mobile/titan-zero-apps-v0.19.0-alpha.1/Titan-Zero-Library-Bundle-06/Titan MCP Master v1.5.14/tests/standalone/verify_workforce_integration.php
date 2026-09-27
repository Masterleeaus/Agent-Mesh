<?php
$path = dirname(__DIR__, 2) . '/workforce-integration.json';
$doc = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
$fail=[];
foreach(['schema_version','provider','tenant_key','ownership','capabilities','tools','commands','availability','governance','evidence_outcomes'] as $k){if(!array_key_exists($k,$doc))$fail[]='missing '.$k;}
if(($doc['tenant_key']??null)!=='company_id')$fail[]='tenant_key must be company_id';
if(($doc['ownership']['workforce_employee_identity']??null)!=='titan-ai-workforce')$fail[]='workforce identity owner';
if(($doc['availability']['fail_closed']??null)!==true)$fail[]='availability must fail closed';
if(($doc['governance']['installed_does_not_imply_authorized']??null)!==true)$fail[]='install must not grant authority';
if(($doc['provider_lifecycle']['upgrade_does_not_grant_authority']??null)!==true)$fail[]='upgrade authority invariant';
if($fail){fwrite(STDERR, implode("\n",$fail)."\n"); exit(1);} echo "WORKFORCE_INTEGRATION: PASS\n";

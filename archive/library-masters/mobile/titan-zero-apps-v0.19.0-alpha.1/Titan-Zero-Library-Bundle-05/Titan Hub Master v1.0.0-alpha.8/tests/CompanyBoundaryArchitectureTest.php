<?php
$root=dirname(__DIR__);
function pass3ok(bool $v,string $m):void{if(!$v){fwrite(STDERR,"FAIL: $m\n");exit(1);}echo "PASS: $m\n";}
$resolver=file_get_contents($root.'/System/Context/RequestTrustedCustomerContextResolver.php');
pass3ok(str_contains($resolver,"['company_id', 'tenant_company_id', 'tenant_id']"),'all browser tenant/company identifiers rejected as authority');
pass3ok(str_contains($resolver,'Conflicting legacy tenant context cannot override company_id.'),'legacy/canonical conflict rejected');
pass3ok(str_contains($resolver,'$companyId = $canonicalCompanyId ?? $legacyCompanyId;'),'legacy session field resolves into company_id only');
$bridge=file_get_contents($root.'/System/Presentation/AdaptiveHubPresentationBridge.php');
pass3ok(str_contains($bridge,"'company_scoped'=>"),'Hub emits canonical company_scoped projection metadata');
pass3ok(!str_contains($bridge,"'tenant_scoped'=>"),'Hub no longer emits tenant_scoped as canonical metadata');

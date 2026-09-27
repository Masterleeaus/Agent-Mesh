<?php
$root=dirname(__DIR__);
function ok(bool $v,string $m):void{if(!$v){fwrite(STDERR,"FAIL: $m\n");exit(1);}echo "PASS: $m\n";}
$ext=json_decode(file_get_contents($root.'/extension.json'),true,512,JSON_THROW_ON_ERROR);
ok($ext['slug']==='titan-hub','canonical extension slug');
ok($ext['provider']==='App\\Extensions\\TitanHub\\System\\TitanHubServiceProvider','provider namespace');
$gateway=file_get_contents($root.'/System/Contracts/CustomerOperationsGateway.php');
foreach(['home','services','serviceRequests','createServiceRequest','jobs','bookings','quotes','approveQuote','invoices','documents','profile'] as $method)ok(str_contains($gateway,'function '.$method.'('),'CRM-compatible gateway method '.$method);
$context=file_get_contents($root.'/System/Context/RequestTrustedCustomerContextResolver.php');
ok(str_contains($context,"['company_id', 'tenant_company_id', 'tenant_id']"),'client company/legacy tenant keys explicitly rejected');
$sw=file_get_contents($root.'/System/Http/Controllers/HubPwaController.php');
ok(str_contains($sw,"u.pathname.includes('/api/')||e.request.mode==='navigate'"),'private/API navigation forced to network');
ok(str_contains($sw,"cache:'no-store'"),'network private navigation uses no-store');
$agg=file_get_contents($root.'/System/Operations/AggregatingCustomerOperationsGateway.php');
ok(!preg_match('/DB::|->table\(|Eloquent|Model::/', $agg),'Hub aggregator has no direct domain database access');
$js=file_get_contents($root.'/resources/js/hub.js');
ok(!preg_match('/\beval\s*\(|new\s+Function\s*\(/',$js),'client runtime has no eval/new Function');
